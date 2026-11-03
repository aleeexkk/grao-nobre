import { ErroAplicacao } from "./ErroAplicacao";

// Erro personalizado: o dado é válido, mas já existe (ex: e-mail repetido) (HTTP 409)
export class ErroConflito extends ErroAplicacao {
    readonly status = 409;
}
