import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import CampoSelecao from "../components/CampoSelecao";
import CartaoGrafico from "../components/CartaoGrafico";
import CartaoMetrica from "../components/CartaoMetrica";
import GraficoDispersao from "../components/graficos/GraficoDispersao";
import GraficoFaturamentoDia from "../components/graficos/GraficoFaturamentoDia";
import GraficoHorarios from "../components/graficos/GraficoHorarios";
import GraficoProdutos from "../components/graficos/GraficoProdutos";
import { descreverRegressao } from "../estatisticas/descricoes";
import {
    desvioPadrao,
    faturamentoPorDia,
    faturamentoTotal,
    media,
    mediana,
    precoVersusUnidades,
    quantidadePedidos,
    rankingProdutos,
    regressaoLinear,
    ticketMedio,
    vendasPorHora,
} from "../estatisticas/metricas";
import type { Venda } from "../estatisticas/tipos";
import { useDados } from "../hooks/useDados";
import { buscarVendas } from "../servicos/recursos";
import { formatarMoeda } from "../utils/formatacao";

// Períodos que a pessoa pode escolher (a API aceita de 1 a 365 dias)
const PERIODOS = [
    { valor: "7", rotulo: "Últimos 7 dias" },
    { valor: "30", rotulo: "Últimos 30 dias" },
    { valor: "90", rotulo: "Últimos 90 dias" },
];

interface PainelProps {
    vendas: Venda[];
    dias: number;
}

// Cartões e gráficos. Só é desenhado quando existe pelo menos uma venda (por isso os cálculos não precisam
// se preocupar com listas vazias).
function Painel({ vendas, dias }: PainelProps) {
    const porDia = faturamentoPorDia(vendas);
    const valoresDiarios = porDia.map((d) => d.faturamento);
    const ranking = rankingProdutos(vendas);
    const porHora = vendasPorHora(vendas);
    const pico = porHora.reduce((maior, h) => (h.unidades > maior.unidades ? h : maior));
    const pedidos = quantidadePedidos(vendas);

    // Dispersão e regressão (preço x unidades vendidas)
    const pontos = precoVersusUnidades(vendas);
    const regressao = regressaoLinear(
        pontos.map((p) => p.preco),
        pontos.map((p) => p.unidades)
    );
    const maisVendido = ranking[0];

    return (
        <>
            <section className="cartoes">
                <CartaoMetrica
                    titulo="Faturamento total"
                    valor={formatarMoeda(faturamentoTotal(vendas))}
                    descricao={`${pedidos} ${pedidos === 1 ? "pedido pago" : "pedidos pagos"}`}
                />
                <CartaoMetrica titulo="Valor médio por pedido" valor={formatarMoeda(ticketMedio(vendas))} />
                <CartaoMetrica
                    titulo="Média diária (dias com vendas)"
                    valor={formatarMoeda(media(valoresDiarios))}
                    descricao={`Mediana: ${formatarMoeda(mediana(valoresDiarios))}`}
                />
                <CartaoMetrica
                    titulo="Variação diária (desvio padrão)"
                    valor={formatarMoeda(desvioPadrao(valoresDiarios))}
                />
                {maisVendido && (
                    <CartaoMetrica
                        titulo="Produto mais vendido"
                        valor={maisVendido.produto}
                        descricao={`${maisVendido.unidades} unidades`}
                    />
                )}
                <CartaoMetrica
                    titulo="Horário de pico"
                    valor={`${pico.hora}h`}
                    descricao={`${pico.unidades} unidades vendidas`}
                />
            </section>

            <CartaoGrafico
                titulo="Produtos mais vendidos"
                descricao={`Unidades vendidas de cada item do cardápio nos últimos ${dias} dias.`}
            >
                <GraficoProdutos dados={ranking} />
            </CartaoGrafico>

            <CartaoGrafico
                titulo="Faturamento por dia"
                descricao="Série temporal dos dias com vendas. A linha tracejada é a média diária."
            >
                <GraficoFaturamentoDia dados={porDia} mediaDiaria={media(valoresDiarios)} />
            </CartaoGrafico>

            <CartaoGrafico
                titulo="Vendas por horário"
                descricao="Unidades vendidas em cada faixa de 1 hora. A barra vermelha é o horário de pico."
            >
                <GraficoHorarios dados={porHora} />
            </CartaoGrafico>

            <CartaoGrafico titulo="Preço x unidades vendidas" descricao={descreverRegressao(regressao)}>
                <GraficoDispersao dados={pontos} regressao={regressao} />
            </CartaoGrafico>
        </>
    );
}

export default function Dashboard() {
    const [dias, setDias] = useState(30);

    // Busca as vendas reais (itens de pedidos PAGOS) sempre que o período muda
    const carregar = useCallback(() => buscarVendas(dias), [dias]);
    const { dados, erro, carregando } = useDados(carregar);

    return (
        <main>
            <h1>Painel da Cafeteria</h1>
            <p>Vendas dos últimos {dias} dias. Só entram pedidos marcados como pagos.</p>

            <div className="filtro-periodo">
                <CampoSelecao
                    id="periodo"
                    rotulo="Período"
                    valor={String(dias)}
                    opcoes={PERIODOS}
                    aoMudar={(novo) => setDias(Number(novo))}
                    permitirVazio={false}
                />
            </div>

            {erro !== "" && (
                <p className="erro-api" role="alert">
                    {erro}
                </p>
            )}

            {dados === null && carregando && <p>Carregando...</p>}

            {dados !== null && dados.vendas.length === 0 && erro === "" && !carregando && (
                <p className="estado-lista">
                    Ainda não há vendas pagas neste período. <Link to="/pedidos/novo">Abra um pedido</Link>, adicione os
                    itens e marque como pago para ver os números aqui.
                </p>
            )}

            {dados !== null && dados.vendas.length > 0 && (
                <div className={carregando ? "atualizando" : undefined}>
                    <Painel vendas={dados.vendas} dias={dados.dias} />
                </div>
            )}
        </main>
    );
}
