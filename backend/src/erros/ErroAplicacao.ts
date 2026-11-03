// Classe base ABSTRATA de todos os erros "esperados" da aplicação (não dá pra criar um direto).
// Cada erro filho diz qual é o seu código HTTP. O tratador de erros só conhece ESTA classe e usa
// o "status" de cada filho (polimorfismo): pra criar um erro novo, basta estender, nada mais muda.
export abstract class ErroAplicacao extends Error {
    abstract readonly status: number; // código HTTP (400, 401, 403, 404, 409...)

    constructor(mensagem: string) {
        super(mensagem); // manda a mensagem pra classe Error original
        this.name = new.target.name; // nome da classe filha (ex: "ErroValidacao")
    }
}
