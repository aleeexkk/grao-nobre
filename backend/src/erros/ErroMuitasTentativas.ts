import { ErroAplicacao } from "./ErroAplicacao";

// Erro personalizado: a pessoa errou a senha vezes demais e precisa esperar um pouco (HTTP 429)
export class ErroMuitasTentativas extends ErroAplicacao {
    readonly status = 429;
}
