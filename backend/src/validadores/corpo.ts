import { ErroValidacao } from "../erros/ErroValidacao";

// Confere que o corpo da requisição é um objeto e que CADA campo pedido existe e é texto.
// "Generics" (<C extends string>): a função serve pra qualquer lista de campos e devolve
// um objeto tipado com exatamente esses campos (ex: pedir ["email","senha"] devolve {email, senha}).
export function lerCamposTexto<C extends string>(
    corpo: unknown,
    campos: readonly C[],
    mensagem: string
): Record<C, string> {
    if (typeof corpo !== "object" || corpo === null) {
        throw new ErroValidacao(mensagem);
    }

    const origem = corpo as Record<string, unknown>;
    const resultado = {} as Record<C, string>;

    for (const campo of campos) {
        const valor = origem[campo];
        if (typeof valor !== "string") {
            throw new ErroValidacao(mensagem); // faltou o campo (ou não é texto)
        }
        resultado[campo] = valor;
    }

    return resultado;
}

// Converte o "id" que vem na URL (sempre texto) em número inteiro positivo
export function lerId(valor: unknown): number {
    if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
        throw new ErroValidacao("Id inválido.");
    }

    const id = Number(valor);
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ErroValidacao("Id inválido.");
    }

    return id;
}
