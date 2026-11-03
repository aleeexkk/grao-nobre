import { ErroAplicacao } from "./ErroAplicacao";

// Erro personalizado: o recurso pedido não existe (HTTP 404)
export class ErroNaoEncontrado extends ErroAplicacao {
    readonly status = 404;
}
