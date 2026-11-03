import { ErroAplicacao } from "./ErroAplicacao";

// Erro personalizado: usado quando um dado não passa na validação (HTTP 400)
export class ErroValidacao extends ErroAplicacao {
    readonly status = 400;
}
