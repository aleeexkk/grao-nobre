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
export interface PontoPrecoQuantidade {
    produto: string;
    preco: number;
    unidades: number;
}
export interface ResultadoRegressao {
    inclinacao: number; // quanto o Y muda a cada 1 unidade a mais no X
    intercepto: number; // onde a reta cruza o eixo Y
    correlacao: number; // de -1 a +1
    r2: number; // de 0 a 1 (correlação ao quadrado)
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

// ---------- Dispersão e regressão ----------

// Um ponto por produto: o preço dele e quantas unidades vendeu no mês
export function precoVersusUnidades(vendas: Venda[]): PontoPrecoQuantidade[] {
    const porProduto = agruparPor(vendas, (v) => v.produto);
    return [...porProduto.entries()].map(([produto, lista]) => ({
        produto,
        preco: lista[0].valorUnitario, // o preço é o mesmo em todas as vendas do produto
        unidades: somar(lista.map((v) => v.quantidade)),
    }));
}

// Regressão linear simples (método dos mínimos quadrados): y = intercepto + inclinação * x
export function regressaoLinear(x: number[], y: number[]): ResultadoRegressao {
    // Precisa de pelo menos 2 pontos e listas do mesmo tamanho
    if (x.length < 2 || x.length !== y.length) {
        return { inclinacao: 0, intercepto: 0, correlacao: 0, r2: 0 };
    }

    const mediaX = media(x);
    const mediaY = media(y);

    let somaXY = 0; // soma de (desvio de x) * (desvio de y)
    let somaXX = 0; // soma dos desvios de x ao quadrado
    let somaYY = 0; // soma dos desvios de y ao quadrado
    for (let i = 0; i < x.length; i++) {
        const desvioX = x[i] - mediaX;
        const desvioY = y[i] - mediaY;
        somaXY += desvioX * desvioY;
        somaXX += desvioX * desvioX;
        somaYY += desvioY * desvioY;
    }

    const inclinacao = somaXX === 0 ? 0 : somaXY / somaXX;
    const intercepto = mediaY - inclinacao * mediaX;
    const correlacao = somaXX === 0 || somaYY === 0 ? 0 : somaXY / Math.sqrt(somaXX * somaYY);

    return { inclinacao, intercepto, correlacao, r2: correlacao ** 2 };
}