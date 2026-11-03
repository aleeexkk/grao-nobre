import { ErroAplicacao } from "./ErroAplicacao";

// Erro personalizado: está logada, mas não pode fazer isso (ex: editar outro usuário) (HTTP 403)
export class ErroProibido extends ErroAplicacao {
    readonly status = 403;
}
