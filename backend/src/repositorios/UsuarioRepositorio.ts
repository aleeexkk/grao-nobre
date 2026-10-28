import { pool } from "../config/conexao";
import { Usuario } from "../entidades/Usuario";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise"; // só tipos, pro TypeScript entender o resultado

// Classe responsável por TODA conversa com a tabela "usuario"
export class UsuarioRepositorio {
    // Salva um usuário novo e devolve o id que o banco gerou
    async inserir(usuario: Usuario, senhaHash: string): Promise<number> {
        // Os "?" são preenchidos pelo array: isso protege contra SQL Injection
        const [resultado] = await pool.execute<ResultSetHeader>(
            "INSERT INTO usuario (nome, email, senha, cpf) VALUES (?, ?, ?, ?)",
            [usuario.nome, usuario.email, senhaHash, usuario.cpf]
        );
        return resultado.insertId;
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
}