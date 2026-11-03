import jwt from "jsonwebtoken";
import { ErroNaoAutorizado } from "../erros/ErroNaoAutorizado";

// O que guardamos "dentro" do token (nunca a senha!)
export interface DadosToken {
    id: number;
    email: string;
}

// Responsável só por CRIAR e CONFERIR tokens JWT (uma responsabilidade só)
export class TokenServico {
    private readonly segredo: string; // chave secreta: só o servidor sabe (vem do .env)
    private readonly expiraEmSegundos: number; // depois desse tempo o token deixa de valer

    constructor(segredo: string, expiraEmSegundos: number) {
        this.segredo = segredo;
        this.expiraEmSegundos = expiraEmSegundos;
    }

    // Cria o token: é como um "crachá" assinado com a chave secreta
    gerar(dados: DadosToken): string {
        return jwt.sign({ email: dados.email }, this.segredo, {
            algorithm: "HS256",
            subject: String(dados.id), // "sub" = de quem é o token
            expiresIn: this.expiraEmSegundos,
        });
    }

    // Confere o crachá: assinatura certa e dentro da validade. Se não, ErroNaoAutorizado (401)
    validar(token: string): DadosToken {
        try {
            // "algorithms" trava o único tipo de assinatura aceito (evita truques com token falso)
            const conteudo = jwt.verify(token, this.segredo, { algorithms: ["HS256"] });

            if (typeof conteudo === "string" || typeof conteudo.sub !== "string" || typeof conteudo.email !== "string") {
                throw new Error("Conteúdo do token inesperado");
            }

            const id = Number(conteudo.sub);
            if (!Number.isSafeInteger(id) || id <= 0) {
                throw new Error("Id do token inválido");
            }

            return { id, email: conteudo.email };
        } catch {
            // Mensagem única de propósito: não contamos ao "invasor" o que deu errado
            throw new ErroNaoAutorizado("Sessão inválida ou expirada. Faça login novamente.");
        }
    }
}
