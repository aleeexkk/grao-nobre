import type { RowDataPacket } from "mysql2/promise";
import { pool } from "./config/conexao";
import { UsuarioRepositorio } from "./repositorios/UsuarioRepositorio";
import { UsuarioServico } from "./servicos/UsuarioServico";
import { ErroConflito } from "./erros/ErroConflito";
import { ErroValidacao } from "./erros/ErroValidacao";

async function testar() {
    const servico = new UsuarioServico(new UsuarioRepositorio());
    const dados = {
        nome: "Teste Servico",
        email: "teste.servico@email.com",
        senha: "Senha@123",
        cpf: "529.982.247-25",
    };

    try {
        // Cadastro válido
        const criado = await servico.cadastrar(dados);
        console.log("Cadastrado:", criado);

        // Confere que a senha NÃO está guardada em texto puro
        const [linhas] = await pool.query<RowDataPacket[]>(
            "SELECT senha FROM usuario WHERE email = ?",
            [dados.email]
        );
        console.log("Senha no banco (hash):", linhas[0].senha);

        // Cadastro repetido: tem que ser barrado
        try {
            await servico.cadastrar(dados);
        } catch (erro) {
            if (erro instanceof ErroConflito) console.log("Duplicado barrado:", erro.message);
        }

        // Senha fraca: tem que ser barrada
        try {
            await servico.cadastrar({ ...dados, email: "outro@email.com", senha: "123" });
        } catch (erro) {
            if (erro instanceof ErroValidacao) console.log("Senha fraca barrada:", erro.message);
        }
    } finally {
        // Limpa o teste e fecha as conexões
        await pool.execute("DELETE FROM usuario WHERE email = ?", [dados.email]);
        await pool.end();
    }
}

testar();