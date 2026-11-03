import { lerToken } from "./sessao";

// Endereço do back-end
const URL_API = "http://localhost:3000";

// ===== Formatos dos dados que vão e voltam da API =====

// Dados do cadastro
export interface DadosCadastro {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
}

// Quem está logado (é o que o contexto guarda)
export interface Usuario {
    id: number;
    nome: string;
    email: string;
}

// Perfil completo (a tela de edição precisa do CPF também)
export interface PerfilUsuario extends Usuario {
    cpf: string;
}

// O que a API devolve no login
export interface RespostaLogin {
    token: string;
    usuario: Usuario;
}

// Dados da edição (o e-mail nem é enviado: ele não pode mudar)
export interface DadosEdicao {
    nome: string;
    cpf: string;
    senha: string;
}

// Erro personalizado do front: carrega uma mensagem pronta pra mostrar pro usuário
// e o código HTTP (0 = nem chegou a ter resposta, ex: servidor desligado)
export class ErroApi extends Error {
    readonly status: number;

    constructor(mensagem: string, status = 0) {
        super(mensagem);
        this.name = "ErroApi";
        this.status = status;
    }
}

// Função única que faz TODAS as chamadas à API (assim o tratamento de erro fica num lugar só).
// <T> (generics) = o tipo do que esperamos receber de volta.
// comToken = true manda o token no cabeçalho (rotas protegidas).
async function requisicao<T>(
    metodo: "GET" | "POST" | "PUT",
    caminho: string,
    corpo?: unknown,
    comToken = false
): Promise<T> {
    const cabecalhos: Record<string, string> = {};
    if (corpo !== undefined) {
        cabecalhos["Content-Type"] = "application/json";
    }
    const token = lerToken();
    if (comToken && token !== null) {
        cabecalhos["Authorization"] = `Bearer ${token}`;
    }

    let resposta: Response;

    // Se o servidor estiver desligado, o fetch falha aqui (nem chega a ter resposta)
    try {
        resposta = await fetch(`${URL_API}${caminho}`, {
            method: metodo,
            headers: cabecalhos,
            body: corpo === undefined ? undefined : JSON.stringify(corpo),
        });
    } catch {
        throw new ErroApi("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    }

    // Lê o JSON da resposta (se não conseguir, vira null)
    const dados: unknown = await resposta.json().catch(() => null);

    // Respostas 400, 401, 403, 409, 500... (qualquer coisa fora de 2xx)
    if (!resposta.ok) {
        // O back-end manda { erro: "mensagem" }: mostramos essa mensagem
        if (typeof dados === "object" && dados !== null && "erro" in dados && typeof dados.erro === "string") {
            throw new ErroApi(dados.erro, resposta.status);
        }
        throw new ErroApi("Não foi possível concluir a operação. Tente novamente.", resposta.status);
    }

    // A API é nossa e devolve sempre o formato combinado, então confiamos nele aqui
    return dados as T;
}

// ===== Funções que as telas usam =====

export async function cadastrarUsuario(dados: DadosCadastro): Promise<void> {
    await requisicao<unknown>("POST", "/usuarios", dados);
}

export function fazerLogin(email: string, senha: string): Promise<RespostaLogin> {
    return requisicao<RespostaLogin>("POST", "/auth/login", { email, senha });
}

export function buscarPerfil(): Promise<PerfilUsuario> {
    return requisicao<PerfilUsuario>("GET", "/usuarios/me", undefined, true);
}

export function atualizarPerfil(id: number, dados: DadosEdicao): Promise<PerfilUsuario> {
    return requisicao<PerfilUsuario>("PUT", `/usuarios/${id}`, dados, true);
}
