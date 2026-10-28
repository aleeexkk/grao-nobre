// Erro personalizado: usado quando um dado não passa na validação
export class ErroValidacao extends Error {
    constructor(mensagem: string) {
        super(mensagem); // manda a mensagem pra classe Error original
        this.name = "ErroValidacao"; // nome que aparece quando o erro é mostrado
    }
}