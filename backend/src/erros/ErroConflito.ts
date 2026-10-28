// Erro personalizado: usado quando o dado é válido, mas já existe (ex: e-mail repetido)
export class ErroConflito extends Error {
    constructor(mensagem: string) {
        super(mensagem);
        this.name = "ErroConflito";
    }
}