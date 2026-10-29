import type { Venda } from "../dados/vendas";

// Formatos dos resultados
export interface FaturamentoDia {
    data: string;
    faturamento: number;
}
export interface ItemRanking {
    produto: string;
    unidades: number;
    faturamento: number;
}
export interface VendasHora {
    hora: number;
    unidades: number;
}

// Valor de uma linha de venda (quantidade x preço)
function valorDaVenda(venda: Venda): number {
    return venda.quantidade * venda.valorUnitario;
}

function somar(numeros: number[]): number {
    return numeros.reduce((soma, n) => soma + n, 0);
}

// Separa os itens em "gavetas" de acordo com uma chave (ex: agrupar vendas por dia)
// <T> = serve pra qualquer tipo de item (Generics)
function agruparPor<T>(itens: T[], chave: (item: T) => string): Map<string, T[]> {
    return itens.reduce((mapa, item) => {
        const nome = chave(item);
        const grupo = mapa.get(nome) ?? []; // pega a gaveta (ou cria uma vazia)
        grupo.push(item);
        mapa.set(nome, grupo);
        return mapa;
    }, new Map<string, T[]>());
}

// ---------- Estatística descritiva ----------

export function media(numeros: number[]): number {
    return numeros.length === 0 ? 0 : somar(numeros) / numeros.length;
}

export function mediana(numeros: number[]): number {
    if (numeros.length === 0) return 0;
    const ordenados = [...numeros].sort((a, b) => a - b); // cópia ordenada (não mexe na original)
    const meio = Math.floor(ordenados.length / 2);
    // Quantidade par: média dos dois do meio. Ímpar: o do meio.
    return ordenados.length % 2 === 0
        ? (ordenados[meio - 1] + ordenados[meio]) / 2
        : ordenados[meio];
}

// Desvio padrão amostral (divide por n - 1)
export function desvioPadrao(numeros: number[]): number {
    if (numeros.length < 2) return 0;
    const mediaGeral = media(numeros);
    const somaQuadrados = somar(numeros.map((n) => (n - mediaGeral) ** 2));
    return Math.sqrt(somaQuadrados / (numeros.length - 1));
}

// ---------- Métricas do negócio ----------

export function faturamentoTotal(vendas: Venda[]): number {
    return somar(vendas.map(valorDaVenda));
}

// Valor médio de cada venda
export function ticketMedio(vendas: Venda[]): number {
    return media(vendas.map(valorDaVenda));
}

// Série temporal: quanto a cafeteria faturou em cada dia
export function faturamentoPorDia(vendas: Venda[]): FaturamentoDia[] {
    const porDia = agruparPor(vendas, (v) => v.data);
    return [...porDia.entries()]
        .map(([data, lista]) => ({ data, faturamento: somar(lista.map(valorDaVenda)) }))
        .sort((a, b) => a.data.localeCompare(b.data)); // ordena por data
}

// Ranking: produtos do mais vendido pro menos vendido
export function rankingProdutos(vendas: Venda[]): ItemRanking[] {
    const porProduto = agruparPor(vendas, (v) => v.produto);
    return [...porProduto.entries()]
        .map(([produto, lista]) => ({
            produto,
            unidades: somar(lista.map((v) => v.quantidade)),
            faturamento: somar(lista.map(valorDaVenda)),
        }))
        .sort((a, b) => b.unidades - a.unidades);
}

// Quantas unidades saem em cada hora (das 7h às 19h): mostra o horário de pico
export function vendasPorHora(vendas: Venda[]): VendasHora[] {
    const porHora = agruparPor(vendas, (v) => String(v.hora));
    const resultado: VendasHora[] = [];
    for (let hora = 7; hora <= 19; hora++) {
        const lista = porHora.get(String(hora)) ?? [];
        resultado.push({ hora, unidades: somar(lista.map((v) => v.quantidade)) });
    }
    return resultado;
}