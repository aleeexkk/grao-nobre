import bcrypt from "bcryptjs";
import type { IUsuarioRepositorio } from "../repositorios/IUsuarioRepositorio";
import { TokenServico } from "./TokenServico";
import { LimitadorDeTentativas } from "./LimitadorDeTentativas";
import { ErroNaoAutorizado } from "../erros/ErroNaoAutorizado";
import { ErroValidacao } from "../erros/ErroValidacao";
import { ErroMuitasTentativas } from "../erros/ErroMuitasTentativas";
import { validarEmail } from "../validadores/validadores";

// O que devolvemos depois de um login bem-sucedido
export interface ResultadoLogin {
    token: string;
    usuario: { id: number; nome: string; email: string };
}

// Hash "de mentira": serve pra gastar o MESMO tempo do bcrypt quando o e-mail não existe.
// Sem isso, o login de um e-mail inexistente responderia bem mais rápido e entregaria quem tem conta.
const HASH_FALSO = bcrypt.hashSync("senha-que-nunca-vale-nada", 10);

// Responsável só pelo LOGIN (conferir e-mail/senha e entregar o token)
export class AutenticacaoServico {
    private repositorio: IUsuarioRepositorio;
    private tokens: TokenServico;
    private limitador: LimitadorDeTentativas; // trava quem erra a senha vezes demais (força bruta)

    constructor(
        repositorio: IUsuarioRepositorio,
        tokens: TokenServico,
        limitador: LimitadorDeTentativas = new LimitadorDeTentativas()
    ) {
        this.repositorio = repositorio;
        this.tokens = tokens;
        this.limitador = limitador;
    }

    // "origem" = de onde veio a chamada (o IP). A trava vale pra cada par origem + e-mail
    async entrar(email: string, senha: string, origem = ""): Promise<ResultadoLogin> {
        // 1) E-mail precisa ter formato válido (regex). Senha não pode estar vazia
        const emailLimpo = validarEmail(email);
        if (senha.length === 0) {
            throw new ErroValidacao("Informe a senha.");
        }

        // 2) Já errou demais? Espera um tempo antes de tentar de novo (429)
        const chave = `${origem}|${emailLimpo}`;
        const espera = this.limitador.segundosDeEspera(chave);
        if (espera > 0) {
            throw new ErroMuitasTentativas(
                `Muitas tentativas de login. Tente de novo em ${Math.ceil(espera / 60)} minuto(s).`
            );
        }

        // 3) Só entra quem existe E acertou a senha. A comparação roda SEMPRE (com o hash de mentira se o
        // e-mail não existe), então o tempo de resposta é igual nos dois casos
        const registro = await this.repositorio.buscarPorEmail(emailLimpo);
        const senhaConfere = await bcrypt.compare(senha, registro?.senhaHash ?? HASH_FALSO);

        // Mesma mensagem pros dois casos: não contamos se o e-mail existe ou não
        if (registro === null || !senhaConfere) {
            this.limitador.registrarFalha(chave);
            throw new ErroNaoAutorizado("E-mail ou senha inválidos.");
        }

        // 4) Tudo certo: zera as falhas e entrega o token (o "crachá")
        this.limitador.registrarSucesso(chave);
        const token = this.tokens.gerar({ id: registro.id, email: registro.email });
        return { token, usuario: { id: registro.id, nome: registro.nome, email: registro.email } };
    }
}
