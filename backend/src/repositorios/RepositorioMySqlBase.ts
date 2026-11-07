import { pool } from "../config/conexao";
import { ErroConflito } from "../erros/ErroConflito";
import type { Filtros } from "../tipos/Filtros";
import type { Pagina } from "../tipos/Pagina";
import type { IRepositorioCrud } from "./IRepositorioCrud";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Classe ABSTRATA: é o "esqueleto" comum de todo repositório MySQL. Não dá pra usar sozinha
// (não existe "new RepositorioMySqlBase"): cada tabela cria uma classe FILHA que preenche o que muda.
//   TEntidade = classe que valida os dados (ex: Categoria)
//   TRegistro = como o dado aparece depois de lido (ex: CategoriaRegistro)
//   TLinha    = a linha crua que o banco devolve (ex: LinhaCategoria)
export abstract class RepositorioMySqlBase<TEntidade, TRegistro, TLinha extends RowDataPacket>
    implements IRepositorioCrud<TEntidade, TRegistro>
{
    // ---- O que cada filha É OBRIGADA a informar (muda de tabela pra tabela) ----
    // Obs: nomes de tabela/coluna são constantes escritas por nós no código, nunca vêm do usuário.
    // Já os VALORES (id, nome...) sempre entram pelos "?", que protegem contra SQL Injection.
    protected abstract readonly tabela: string; // ex: "categoria"
    protected abstract readonly colunaId: string; // ex: "id_categoria"
    protected abstract readonly colunas: string; // ex: "id_categoria, nome, descricao"

    // Como transformar uma linha do banco no registro do sistema
    protected abstract paraRegistro(linha: TLinha): TRegistro;

    // ---- Opcionais: a filha pode trocar se precisar ----

    // De onde as consultas (SELECT) leem os dados. Por padrão é a própria tabela, mas uma filha
    // pode trocar por um JOIN com outra tabela (ex: produto + categoria)
    protected get origem(): string {
        return this.tabela;
    }

    // Em que ORDEM a listagem sai. Por padrão pelo id (do mais antigo pro mais novo);
    // uma filha pode trocar (ex: pedidos: os mais recentes primeiro)
    protected get ordenacao(): string {
        return this.colunaId;
    }

    // Quais filtros a listagem aceita: "nome do filtro na URL" -> "coluna do banco".
    // Por padrão nenhum. Ex: { idPedido: "i.id_pedido" } deixa listar só os itens de um pedido
    protected get filtrosAceitos(): Readonly<Record<string, string>> {
        return {};
    }

    // Inserir e atualizar mudam as colunas de cada tabela, então cada filha escreve o seu
    abstract inserir(entidade: TEntidade): Promise<TRegistro>;
    abstract atualizar(id: number, entidade: TEntidade): Promise<TRegistro | null>;

    // ---- O que já vem PRONTO pra todas as filhas (escrito uma vez só) ----

    // Lista com paginação. Ex: pagina 2, limite 10 -> pula os 10 primeiros e traz os 10 seguintes
    async listar(pagina: number, limite: number, filtros: Filtros = {}): Promise<Pagina<TRegistro>> {
        const deslocamento = (pagina - 1) * limite; // quantos itens "pular"

        // Monta o WHERE só com os filtros que ESTA classe aceita (as colunas são escritas por nós;
        // os valores entram pelos "?", então não tem como injetar SQL)
        const condicoes: string[] = [];
        const valores: number[] = [];
        for (const [nome, coluna] of Object.entries(this.filtrosAceitos)) {
            const valor: number | undefined = filtros[nome];
            if (valor !== undefined) {
                condicoes.push(`${coluna} = ?`);
                valores.push(valor);
            }
        }
        const where = condicoes.length > 0 ? ` WHERE ${condicoes.join(" AND ")}` : "";

        const [linhas] = await pool.query<TLinha[]>(
            `SELECT ${this.colunas} FROM ${this.origem}${where} ORDER BY ${this.ordenacao} LIMIT ? OFFSET ?`,
            [...valores, limite, deslocamento]
        );

        // Conta quantos existem no total (pra saber quantas páginas são), respeitando os mesmos filtros
        const [contagem] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS total FROM ${this.origem}${where}`,
            valores
        );
        const total = Number(contagem[0]?.total ?? 0);

        return {
            itens: linhas.map((linha) => this.paraRegistro(linha)),
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    // Busca um pelo id. Devolve null se não existir
    async buscarPorId(id: number): Promise<TRegistro | null> {
        const [linhas] = await pool.execute<TLinha[]>(
            `SELECT ${this.colunas} FROM ${this.origem} WHERE ${this.colunaId} = ?`,
            [id]
        );
        const primeira = linhas[0];
        return primeira ? this.paraRegistro(primeira) : null;
    }

    // Apaga pelo id. Devolve true se apagou, false se não existia
    async excluir(id: number): Promise<boolean> {
        try {
            const [resultado] = await pool.execute<ResultSetHeader>(
                `DELETE FROM ${this.tabela} WHERE ${this.colunaId} = ?`,
                [id]
            );
            return resultado.affectedRows > 0;
        } catch (erro) {
            // Tentou apagar algo que outra tabela está usando (ex: categoria que tem produtos)
            if (this.temCodigo(erro, "ER_ROW_IS_REFERENCED_2")) {
                throw new ErroConflito("Não é possível excluir: este registro está sendo usado em outro lugar.");
            }
            throw erro;
        }
    }

    // ---- Ajudantes que as filhas também podem usar ----

    // Confere o "code" que o MySQL coloca no erro (ex: ER_DUP_ENTRY = valor repetido)
    protected temCodigo(erro: unknown, codigo: string): boolean {
        return typeof erro === "object" && erro !== null && "code" in erro && erro.code === codigo;
    }

    // Se o erro for "valor repetido" (UNIQUE), vira ErroConflito (409) em vez de erro 500
    protected traduzirErro(erro: unknown, mensagemDuplicado: string): never {
        if (this.temCodigo(erro, "ER_DUP_ENTRY")) {
            throw new ErroConflito(mensagemDuplicado);
        }
        throw erro;
    }
}
