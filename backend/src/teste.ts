import { pool } from "./config/conexao";
import { Usuario } from "./entidades/Usuario";
import { UsuarioRepositorio } from "./repositorios/UsuarioRepositorio";

async function testar() {
    const repo = new UsuarioRepositorio();
    const u = new Usuario("Teste Repo", "teste.repo@email.com", "Senha@123", "529.982.247-25");

    try {
        console.log("E-mail existe antes?", await repo.existeEmail(u.email)); // esperado: false
        const id = await repo.inserir(u, "hash-de-mentirinha");
        console.log("Inserido com id:", id);
        console.log("E-mail existe depois?", await repo.existeEmail(u.email)); // esperado: true
        console.log("CPF existe?", await repo.existeCpf(u.cpf)); // esperado: true
    } finally {
        // Limpa o teste: apaga o usuário de mentirinha e fecha as conexões
        await pool.execute("DELETE FROM usuario WHERE email = ?", [u.email]);
        await pool.end();
    }
}

testar();