// Uma "linha de venda": um item de um pedido PAGO, com o dia e a hora em que o pedido foi feito.
// É a matéria-prima das estatísticas (médias, ranking, horário de pico...).
export interface VendaRegistro {
    id: number; // id do item
    idPedido: number; // a qual pedido pertence (pra calcular o valor médio de cada pedido)
    data: string; // "2026-11-07"
    hora: number; // 0 a 23
    produto: string;
    categoria: string;
    quantidade: number;
    valorUnitario: number; // preço do produto quando foi vendido
}

// Contrato do repositório de estatísticas (só leitura)
export interface IEstatisticaRepositorio {
    // Vendas (itens de pedidos pagos) dos últimos "dias" dias, da mais antiga pra mais nova
    listarVendas(dias: number): Promise<VendaRegistro[]>;
}
