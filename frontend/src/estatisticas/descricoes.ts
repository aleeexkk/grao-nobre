import type { ResultadoRegressao } from "./metricas";
import { formatarNumero } from "../utils/formatacao";

// Escreve em português o que o resultado da regressão significa
export function descreverRegressao(regressao: ResultadoRegressao): string {
    const sentido = regressao.inclinacao < 0 ? "a menos" : "a mais";
    const unidades = formatarNumero(Math.abs(regressao.inclinacao), 0);
    const percentual = formatarNumero(regressao.r2 * 100, 0);

    return (
        `Reta de regressão: a cada R$ 1 a mais no preço, vendem-se em média ${unidades} unidades ${sentido}. ` +
        `Correlação r = ${formatarNumero(regressao.correlacao, 2)} e R² = ${formatarNumero(regressao.r2, 2)}: ` +
        `o preço explica cerca de ${percentual}% da variação nas vendas ` +
        `(é uma associação, não uma prova de causa).`
    );
}