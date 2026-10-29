// Endereço do back-end
const URL_API = "http://localhost:3000";

// Formato dos dados que o back-end espera no cadastro
export interface DadosCadastro {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
}

// Erro personalizado do front: carrega uma mensagem pronta pra mostrar pro usuário
export class ErroApi extends Error {
    constructor(mensagem: string) {
        super(mensagem);
        this.name = "ErroApi";
    }
}

export async function cadastrarUsuario(dados: DadosCadastro): Promise<void> {
    let resposta: Response;

    // Se o servidor estiver desligado, o fetch falha aqui (nem chega a ter resposta)
    try {
        resposta = await fetch(`${URL_API}/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });
    } catch {
        throw new ErroApi("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    }

    // Respostas 400, 409, 500... (qualquer coisa fora de 2xx)
    if (!resposta.ok) {
        // Tenta ler o JSON { erro: "..." } que o back-end manda (se não conseguir, vira null)
        const corpo: unknown = await resposta.json().catch(() => null);

        if (typeof corpo === "object" && corpo !== null && "erro" in corpo && typeof corpo.erro === "string") {
            throw new ErroApi(corpo.erro);
        }
        throw new ErroApi("Não foi possível concluir o cadastro. Tente novamente.");
    }
}
