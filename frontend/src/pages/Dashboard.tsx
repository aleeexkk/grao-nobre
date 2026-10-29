import { Link } from "react-router-dom";
import CartaoMetrica from "../components/CartaoMetrica";
import CartaoGrafico from "../components/CartaoGrafico"; // NOVO
import GraficoProdutos from "../components/graficos/GraficoProdutos"; // NOVO
import { VENDAS } from "../dados/vendas";
import {
    faturamentoTotal,
    ticketMedio,
    media,
    mediana,
    desvioPadrao,
    faturamentoPorDia,
    rankingProdutos,
    vendasPorHora,
} from "../estatisticas/metricas";
import { formatarMoeda } from "../utils/formatacao";

export default function Dashboard() {
    const porDia = faturamentoPorDia(VENDAS);
    const valoresDiarios = porDia.map((d) => d.faturamento);
    const ranking = rankingProdutos(VENDAS);
    const pico = vendasPorHora(VENDAS).reduce((maior, h) => (h.unidades > maior.unidades ? h : maior));

    return (
        <main>
            <h1>Painel da Cafeteria</h1>
            <p>Dados de exemplo de outubro de 2026.</p>

            <section className="cartoes">
                <CartaoMetrica titulo="Faturamento total" valor={formatarMoeda(faturamentoTotal(VENDAS))} />
                <CartaoMetrica titulo="Valor médio por venda" valor={formatarMoeda(ticketMedio(VENDAS))} />
                <CartaoMetrica
                    titulo="Média diária"
                    valor={formatarMoeda(media(valoresDiarios))}
                    descricao={`Mediana: ${formatarMoeda(mediana(valoresDiarios))}`}
                />
                <CartaoMetrica
                    titulo="Variação diária (desvio padrão)"
                    valor={formatarMoeda(desvioPadrao(valoresDiarios))}
                />
                <CartaoMetrica
                    titulo="Produto mais vendido"
                    valor={ranking[0].produto}
                    descricao={`${ranking[0].unidades} unidades`}
                />
                <CartaoMetrica
                    titulo="Horário de pico"
                    valor={`${pico.hora}h`}
                    descricao={`${pico.unidades} unidades vendidas`}
                />
            </section>

            {/* NOVO: primeiro gráfico */}
            <CartaoGrafico
                titulo="Produtos mais vendidos"
                descricao="Unidades vendidas de cada item do cardápio em outubro."
            >
                <GraficoProdutos dados={ranking} />
            </CartaoGrafico>

            <Link to="/cadastro">Voltar ao cadastro</Link>
        </main>
    );
}