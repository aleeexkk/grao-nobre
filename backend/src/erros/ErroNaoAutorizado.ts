import { ErroAplicacao } from "./ErroAplicacao";

// Erro personalizado: a pessoa não está logada ou errou e-mail/senha/token (HTTP 401)
export class ErroNaoAutorizado extends ErroAplicacao {
    readonly status = 401;
}
