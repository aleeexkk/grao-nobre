import bcrypt from "bcryptjs";
import type { IUsuarioRepositorio } from "../repositorios/IUsuarioRepositorio";
import { TokenServico } from "./TokenServico";
import { ErroNaoAutorizado } from "../erros/ErroNaoAutorizado";
import { ErroValidacao } from "../erros/ErroValidacao";
import { validarEmail } from "../validadores/validadores";

// O que devolvemos depois de um login bem-sucedido
export interface ResultadoLogin {
    token: string;
    usuario: { id: number; nome: string; email: string };
}

// Responsável só pelo LOGIN (conferir e-mail/senha e entregar o token)
export class AutenticacaoServico {
    private repositorio: IUsuarioRepositorio;
    private tokens: TokenServico;

    constructor(repositorio: IUsuarioRepositorio, tokens: TokenServico) {
        this.repositorio = repositorio;
        this.tokens = tokens;
    }

    async entrar(email: string, senha: string): Promise<ResultadoLogin> {
        // 1) E-mail precisa ter formato válido (regex). Senha não pode estar vazia
        const emailLimpo = validarEmail(email);
        if (senha.length === 0) {
            throw new ErroValidacao("Informe a senha.");
        }

        // 2) Só entra quem existe E acertou a senha (compara a senha digitada com o hash do banco)
        const registro = await this.repositorio.buscarPorEmail(emailLimpo);
        const senhaConfere = registro !== null && (await bcrypt.compare(senha, registro.senhaHash));

        // Mesma mensagem pros dois casos: não contamos se o e-mail existe ou não
        if (registro === null || !senhaConfere) {
            throw new ErroNaoAutorizado("E-mail ou senha inválidos.");
        }

        // 3) Tudo certo: entrega o token (o "crachá")
        const token = this.tokens.gerar({ id: registro.id, email: registro.email });
        return { token, usuario: { id: registro.id, nome: registro.nome, email: registro.email } };
    }
}
