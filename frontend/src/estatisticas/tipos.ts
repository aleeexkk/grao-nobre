// Uma "linha de venda": um item de um pedido PAGO (é o que a API de estatísticas devolve)
export interface Venda {
    id: number; // id do item
    idPedido: number; // a qual pedido pertence (pra calcular o valor médio de cada pedido)
    data: string; // "2026-11-07" (ano-mês-dia)
    hora: number; // hora do dia em que o pedido foi feito (0 a 23)
    produto: string;
    categoria: string;
    quantidade: number;
    valorUnitario: number; // preço do produto na hora da venda
}
