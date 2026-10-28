import { pool } from "./config/conexao";

// Pergunta pro banco quantos usuários existem (deve ser 0, a tabela está vazia)
async function testar() {
    try {
        const [linhas] = await pool.query("SELECT COUNT(*) AS total FROM usuario");
        console.log("Conectou! Usuários no banco:", linhas);
    } catch (erro) {
        console.log("Erro ao conectar:", erro);
    } finally {
        await pool.end(); // fecha as conexões pra o programa terminar
    }
}

testar();