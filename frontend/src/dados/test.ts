import { VENDAS } from "./vendas.ts";

console.log("Linhas de venda geradas:", VENDAS.length);
console.log("As 3 primeiras:", VENDAS.slice(0, 3));

// reduce soma o valor de todas as vendas (quantidade x preço)
const faturamento = VENDAS.reduce((soma, v) => soma + v.quantidade * v.valorUnitario, 0);
console.log("Faturamento total (R$):", faturamento);