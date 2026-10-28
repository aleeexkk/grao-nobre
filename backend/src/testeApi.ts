import { pool } from "./config/conexao";

const URL_API = "http://localhost:3000/usuarios";

// Manda um cadastro pra API e mostra o status (201, 400, 409...) e a resposta
async function enviar(titulo: string, corpo: object) {
    const resposta = await fetch(URL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // avisa que o corpo é JSON
        body: JSON.stringify(corpo), // transforma o objeto em texto JSON
    });
    console.log(titulo, "->", resposta.status, await resposta.json());
}

async function testar() {
    const valido = {
        nome: "Teste Api",
        email: "teste.api@email.com",
        senha: "Senha@123",
        cpf: "529.982.247-25",
    };

    try {
        await enviar("1) Cadastro válido", valido); // esperado: 201
        await enviar("2) Repetido", valido); // esperado: 409
        await enviar("3) Senha fraca", { ...valido, email: "outro@email.com", senha: "123" }); // esperado: 400
        await enviar("4) Campos faltando", { nome: "Sem CPF" }); // esperado: 400
        await enviar("5) CPF inválido", { ...valido, email: "cpf.ruim@email.com", cpf: "111.111.111-11" }); // esperado: 400
    } finally {
        // Limpa o usuário de teste e fecha as conexões
        await pool.execute("DELETE FROM usuario WHERE email = ?", [valido.email]);
        await pool.end();
    }
}

testar();