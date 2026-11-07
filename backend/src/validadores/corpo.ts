import { ErroValidacao } from "../erros/ErroValidacao";
import type { Filtros } from "../tipos/Filtros";

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

// Lê um campo de texto OPCIONAL do corpo: se não vier (ou vier null), devolve null.
// Se vier algo que não é texto (ex: número), é erro 400.
export function lerTextoOpcional(corpo: unknown, campo: string, mensagem: string): string | null {
    if (typeof corpo !== "object" || corpo === null) {
        throw new ErroValidacao(mensagem);
    }

    const valor = (corpo as Record<string, unknown>)[campo];
    if (valor === undefined || valor === null) return null; // não informou: tudo bem
    if (typeof valor !== "string") {
        throw new ErroValidacao(mensagem);
    }
    return valor;
}

const LIMITE_PADRAO = 10; // se o front não pedir, vêm 10 itens por página
const LIMITE_MAXIMO = 50; // teto: ninguém pede 1 milhão de itens de uma vez

// Lê "?pagina=2&limite=10" da URL. Tudo é opcional: sem nada, vale pagina 1 e limite 10.
export function lerPaginacao(consulta: unknown): { pagina: number; limite: number } {
    const origem = (typeof consulta === "object" && consulta !== null ? consulta : {}) as Record<string, unknown>;

    // Converte o texto da URL em inteiro (ou usa o padrão se não veio). Texto estranho = erro 400
    function lerInteiro(valor: unknown, padrao: number, mensagem: string): number {
        if (valor === undefined) return padrao;
        if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
            throw new ErroValidacao(mensagem);
        }
        const numero = Number(valor);
        if (!Number.isSafeInteger(numero)) {
            throw new ErroValidacao(mensagem);
        }
        return numero;
    }

    const pagina = lerInteiro(origem.pagina, 1, "Página inválida: use um número inteiro a partir de 1.");
    const limite = lerInteiro(origem.limite, LIMITE_PADRAO, `Limite inválido: use um número inteiro de 1 a ${LIMITE_MAXIMO}.`);

    if (pagina < 1) {
        throw new ErroValidacao("Página inválida: use um número inteiro a partir de 1.");
    }
    if (limite < 1 || limite > LIMITE_MAXIMO) {
        throw new ErroValidacao(`Limite inválido: use um número inteiro de 1 a ${LIMITE_MAXIMO}.`);
    }

    return { pagina, limite };
}

// Lê um campo NUMÉRICO do corpo. Número de verdade (12.5), não texto ("12.5").
export function lerNumero(corpo: unknown, campo: string, mensagem: string): number {
    if (typeof corpo !== "object" || corpo === null) {
        throw new ErroValidacao(mensagem);
    }

    const valor = (corpo as Record<string, unknown>)[campo];
    if (typeof valor !== "number" || !Number.isFinite(valor)) {
        throw new ErroValidacao(mensagem);
    }
    return valor;
}

// Lê os filtros da URL (ex: ?idPedido=5). Só olha os nomes que a rota aceita (a lista "nomes");
// qualquer outro parâmetro é ignorado. Cada filtro precisa ser um número inteiro positivo.
export function lerFiltros(consulta: unknown, nomes: readonly string[]): Filtros {
    const origem = (typeof consulta === "object" && consulta !== null ? consulta : {}) as Record<string, unknown>;
    const filtros: Record<string, number> = {};

    for (const nome of nomes) {
        const valor = origem[nome];
        if (valor === undefined) continue; // filtro é opcional

        if (typeof valor !== "string" || !/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)) || Number(valor) < 1) {
            throw new ErroValidacao(`Filtro inválido: "${nome}" precisa ser um número inteiro positivo.`);
        }
        filtros[nome] = Number(valor);
    }

    return filtros;
}

const DIAS_PADRAO = 30; // sem pedir nada, as estatísticas olham os últimos 30 dias
const DIAS_MAXIMO = 365;

// Lê "?dias=30" (quantos dias pra trás a estatística olha). Opcional: sem nada, vale 30.
export function lerDias(consulta: unknown): number {
    const origem = (typeof consulta === "object" && consulta !== null ? consulta : {}) as Record<string, unknown>;
    const valor = origem.dias;
    const mensagem = `Período inválido: use um número inteiro de 1 a ${DIAS_MAXIMO} dias.`;

    if (valor === undefined) return DIAS_PADRAO;
    if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
        throw new ErroValidacao(mensagem);
    }

    const dias = Number(valor);
    if (!Number.isSafeInteger(dias) || dias < 1 || dias > DIAS_MAXIMO) {
        throw new ErroValidacao(mensagem);
    }
    return dias;
}
