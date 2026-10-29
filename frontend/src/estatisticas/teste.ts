import { VENDAS } from "../dados/vendas.ts";
import { precoVersusUnidades, regressaoLinear } from "./metricas.ts";

// 1) Teste de sanidade: uma reta perfeita y = 2x + 1
const perfeita = regressaoLinear([1, 2, 3, 4], [3, 5, 7, 9]);
console.log("Reta perfeita (esperado: inclinação 2, intercepto 1, correlação 1, r2 1):", perfeita);

// 2) Dados reais da cafeteria: preço x unidades vendidas de cada produto
const pontos = precoVersusUnidades(VENDAS);
console.table(pontos);

const resultado = regressaoLinear(
    pontos.map((p) => p.preco),
    pontos.map((p) => p.unidades)
);
console.log("Inclinação:", resultado.inclinacao.toFixed(2));
console.log("Intercepto:", resultado.intercepto.toFixed(2));
console.log("Correlação (r):", resultado.correlacao.toFixed(2));
console.log("R²:", resultado.r2.toFixed(2));