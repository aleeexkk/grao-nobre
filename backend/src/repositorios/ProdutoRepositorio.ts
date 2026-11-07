import { pool } from "../config/conexao";
import type { Produto } from "../entidades/Produto";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { IProdutoRepositorio, ProdutoRegistro } from "./IProdutoRepositorio";
import { RepositorioMySqlBase } from "./RepositorioMySqlBase";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Uma linha do resultado, do jeito que o banco devolve
interface LinhaProduto extends RowDataPacket {
    id_produto: number;
    nome: string;
    descricao: string | null;
    preco: string; // ATENÇÃO: o MySQL entrega DECIMAL como TEXTO ("12.10"), por isso convertemos abaixo
    id_categoria: number;
    nome_categoria: string;
}

// Classe FILHA: herda listar, buscarPorId e excluir da base e escreve só o que é do produto
export class ProdutoRepositorio
    extends RepositorioMySqlBase<Produto, ProdutoRegistro, LinhaProduto>
    implements IProdutoRepositorio
{
    // Preenche o que a base exigiu
    protected readonly tabela = "produto";
    protected readonly colunaId = "id_produto";
    // "p." e "c." são apelidos das tabelas (necessários porque as duas têm uma coluna "nome")
    protected readonly colunas =
        "p.id_produto, p.nome, p.descricao, p.preco, p.id_categoria, c.nome AS nome_categoria";

    // JOIN: junta cada produto com a sua categoria, casando produto.id_categoria = categoria.id_categoria
    // (como juntar duas planilhas usando o id como "ponte")
    protected override get origem(): string {
        return "produto p INNER JOIN categoria c ON c.id_categoria = p.id_categoria";
    }

    // Converte a linha do banco no formato que o resto do sistema usa
    protected paraRegistro(linha: LinhaProduto): ProdutoRegistro {
        return {
            id: linha.id_produto,
            nome: linha.nome,
            descricao: linha.descricao,
            preco: Number(linha.preco), // texto "12.10" -> número 12.1
            idCategoria: linha.id_categoria,
            categoria: linha.nome_categoria,
        };
    }

    // Salva um produto novo e devolve ele já com id e nome da categoria
    async inserir(produto: Produto): Promise<ProdutoRegistro> {
        let id: number;
        try {
            const [resultado] = await pool.execute<ResultSetHeader>(
                "INSERT INTO produto (nome, descricao, preco, id_categoria) VALUES (?, ?, ?, ?)",
                [produto.nome, produto.descricao, produto.preco, produto.idCategoria]
            );
            id = resultado.insertId;
        } catch (erro) {
            return this.traduzirErroProduto(erro);
        }

        // Lê de volta pelo JOIN pra trazer também o nome da categoria
        const criado = await this.buscarPorId(id);
        if (criado === null) {
            throw new Error("Produto não encontrado logo depois de salvar."); // não deveria acontecer
        }
        return criado;
    }

    // Altera o produto. Devolve o produto atualizado, ou null se o id não existir
    async atualizar(id: number, produto: Produto): Promise<ProdutoRegistro | null> {
        try {
            await pool.execute<ResultSetHeader>(
                "UPDATE produto SET nome = ?, descricao = ?, preco = ?, id_categoria = ? WHERE id_produto = ?",
                [produto.nome, produto.descricao, produto.preco, produto.idCategoria, id]
            );
        } catch (erro) {
            this.traduzirErroProduto(erro);
        }
        return this.buscarPorId(id); // lê de volta: null se o id não existia
    }

    // Traduz os erros do banco em erros nossos (em vez de deixar virar erro 500)
    private traduzirErroProduto(erro: unknown): never {
        // Categoria que não existe (a chave estrangeira barrou)
        if (this.temCodigo(erro, "ER_NO_REFERENCED_ROW_2")) {
            throw new ErroValidacao("A categoria informada não existe.");
        }
        // Nome repetido (ou qualquer outro erro, que a base repassa)
        return this.traduzirErro(erro, "Já existe um produto com esse nome.");
    }
}
