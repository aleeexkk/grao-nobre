import { pool } from "../config/conexao";
import type { Categoria } from "../entidades/Categoria";
import type { CategoriaRegistro, ICategoriaRepositorio } from "./ICategoriaRepositorio";
import { RepositorioMySqlBase } from "./RepositorioMySqlBase";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Uma linha da tabela "categoria", do jeito que o banco devolve
interface LinhaCategoria extends RowDataPacket {
    id_categoria: number;
    nome: string;
    descricao: string | null;
}

// Classe FILHA: herda listar, buscarPorId e excluir da base e só escreve o que é da categoria.
// "extends" = herda da base; "implements" = promete cumprir o contrato.
export class CategoriaRepositorio
    extends RepositorioMySqlBase<Categoria, CategoriaRegistro, LinhaCategoria>
    implements ICategoriaRepositorio
{
    // Preenche o que a base exigiu
    protected readonly tabela = "categoria";
    protected readonly colunaId = "id_categoria";
    protected readonly colunas = "id_categoria, nome, descricao";

    // Converte a linha do banco no formato que o resto do sistema usa
    protected paraRegistro(linha: LinhaCategoria): CategoriaRegistro {
        return { id: linha.id_categoria, nome: linha.nome, descricao: linha.descricao };
    }

    // Salva uma categoria nova e devolve ela já com o id gerado pelo banco
    async inserir(categoria: Categoria): Promise<CategoriaRegistro> {
        try {
            const [resultado] = await pool.execute<ResultSetHeader>(
                "INSERT INTO categoria (nome, descricao) VALUES (?, ?)",
                [categoria.nome, categoria.descricao]
            );
            return { id: resultado.insertId, nome: categoria.nome, descricao: categoria.descricao };
        } catch (erro) {
            return this.traduzirErro(erro, "Já existe uma categoria com esse nome.");
        }
    }

    // Altera nome e descrição. Devolve a categoria atualizada, ou null se o id não existir
    async atualizar(id: number, categoria: Categoria): Promise<CategoriaRegistro | null> {
        try {
            await pool.execute<ResultSetHeader>(
                "UPDATE categoria SET nome = ?, descricao = ? WHERE id_categoria = ?",
                [categoria.nome, categoria.descricao, id]
            );
        } catch (erro) {
            this.traduzirErro(erro, "Já existe uma categoria com esse nome.");
        }
        return this.buscarPorId(id); // lê de volta: null se o id não existia
    }
}