// Filtros opcionais de uma listagem, vindos da URL.
// Ex: GET /itens-pedido?idPedido=5  vira  { idPedido: 5 }
// Só aceitam números (ids), que é o que os nossos filtros usam.
export type Filtros = Readonly<Record<string, number>>;
