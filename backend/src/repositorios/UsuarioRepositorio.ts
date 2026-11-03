import { pool } from "../config/conexao";
import { Usuario } from "../entidades/Usuario";
import { ErroConflito } from "../erros/ErroConflito";
import type { IUsuarioRepositorio, UsuarioRegistro } from "./IUsuarioRepositorio";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise"; // só tipos, pro TypeScript entender o resultado

// Uma linha da tabela "usuario", do jeito que o banco devolve
interface LinhaUsuario extends RowDataPacket {
    id_usuario: number;
    nome: string;
    email: string;
    senha: string; // aqui dentro é o HASH da senha
    cpf: string;
}

// Converte a linha do banco no formato que o resto do sistema usa
function paraRegistro(linha: LinhaUsuario): UsuarioRegistro {
    return {
        id: linha.id_usuario,
        nome: linha.nome,
        email: linha.email,
        cpf: linha.cpf,
        senhaHash: linha.senha,
    };
}

// Se o erro for "duplicado" (E-mail ou CPF UNIQUE), vira ErroConflito (409) em vez de erro 500.
// Isso cobre o caso raro de duas requisições chegarem juntas com o mesmo e-mail/CPF.
function traduzirErroDuplicado(erro: unknown): never {
    if (typeof erro === "object" && erro !== null && "code" in erro && erro.code === "ER_DUP_ENTRY") {
        throw new ErroConflito("E-mail ou CPF já cadastrado.");
    }
    throw erro;
}

// Classe responsável por TODA conversa com a tabela "usuario" (implementa o contrato)
export class UsuarioRepositorio implements IUsuarioRepositorio {
    // Salva um usuário novo e devolve o id que o banco gerou
    async inserir(usuario: Usuario, senhaHash: string): Promise<number> {
        try {
            // Os "?" são preenchidos pelo array: isso protege contra SQL Injection
            const [resultado] = await pool.execute<ResultSetHeader>(
                "INSERT INTO usuario (nome, email, senha, cpf) VALUES (?, ?, ?, ?)",
                [usuario.nome, usuario.email, senhaHash, usuario.cpf]
            );
            return resultado.insertId;
        } catch (erro) {
            return traduzirErroDuplicado(erro);
        }
    }

    // Diz se já existe alguém com esse e-mail
    async existeEmail(email: string): Promise<boolean> {
        const [linhas] = await pool.execute<RowDataPacket[]>(
            "SELECT id_usuario FROM usuario WHERE email = ?",
            [email]
        );
        return linhas.length > 0;
    }

    // Diz se já existe alguém com esse CPF
    async existeCpf(cpf: string): Promise<boolean> {
        const [linhas] = await pool.execute<RowDataPacket[]>(
            "SELECT id_usuario FROM usuario WHERE cpf = ?",
            [cpf]
        );
        return linhas.length > 0;
    }

    // Diz se OUTRA pessoa (id diferente) já usa esse CPF (usado na edição)
    async existeCpfDeOutro(cpf: string, idAtual: number): Promise<boolean> {
        const [linhas] = await pool.execute<RowDataPacket[]>(
            "SELECT id_usuario FROM usuario WHERE cpf = ? AND id_usuario <> ?",
            [cpf, idAtual]
        );
        return linhas.length > 0;
    }

    // Busca um usuário pelo e-mail (usado no login). Devolve null se não existir
    async buscarPorEmail(email: string): Promise<UsuarioRegistro | null> {
        const [linhas] = await pool.execute<LinhaUsuario[]>(
            "SELECT id_usuario, nome, email, senha, cpf FROM usuario WHERE email = ?",
            [email]
        );
        const primeira = linhas[0];
        return primeira ? paraRegistro(primeira) : null;
    }

    // Busca um usuário pelo id. Devolve null se não existir
    async buscarPorId(id: number): Promise<UsuarioRegistro | null> {
        const [linhas] = await pool.execute<LinhaUsuario[]>(
            "SELECT id_usuario, nome, email, senha, cpf FROM usuario WHERE id_usuario = ?",
            [id]
        );
        const primeira = linhas[0];
        return primeira ? paraRegistro(primeira) : null;
    }

    // Atualiza nome, CPF e senha. O e-mail NÃO está no UPDATE de propósito: ele nunca muda
    async atualizar(id: number, usuario: Usuario, senhaHash: string): Promise<void> {
        try {
            await pool.execute<ResultSetHeader>(
                "UPDATE usuario SET nome = ?, cpf = ?, senha = ? WHERE id_usuario = ?",
                [usuario.nome, usuario.cpf, senhaHash, id]
            );
        } catch (erro) {
            traduzirErroDuplicado(erro);
        }
    }
}
