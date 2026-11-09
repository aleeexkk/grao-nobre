import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    LabelList,
    ResponsiveContainer,
} from "recharts";
import type { PontoPrecoQuantidade, ResultadoRegressao } from "../../estatisticas/metricas";

interface GraficoDispersaoProps {
    dados: PontoPrecoQuantidade[]; // um ponto por produto
    regressao: ResultadoRegressao; // inclinação e intercepto da reta
}

// O que o Recharts entrega pra cada rótulo: a posição (x, y) do ponto e o texto (value)
interface RotuloPontoProps {
    x?: number | string;
    y?: number | string;
    value?: unknown;
}

// Escreve o nome do produto ao lado do ponto, numa linha só (o rótulo padrão quebrava o nome em
// várias linhas e os nomes de pontos vizinhos ficavam um em cima do outro)
function RotuloPonto({ x, y, value }: RotuloPontoProps) {
    if (x === undefined || y === undefined) return null;
    return (
        <text x={Number(x) + 9} y={Number(y) + 4} className="rotulo-ponto">
            {String(value)}
        </text>
    );
}

// Gráfico de dispersão: cada ponto é um produto (preço x unidades vendidas) + reta de regressão
export default function GraficoDispersao({ dados, regressao }: GraficoDispersaoProps) {
    // A reta vai do menor ao maior preço (com 1 real de folga nas pontas)
    const precos = dados.map((d) => d.preco);
    const xMin = Math.min(...precos) - 1;
    const xMax = Math.max(...precos) + 1;

    // Equação da reta: y = intercepto + inclinação * x
    const yDaReta = (x: number) => regressao.intercepto + regressao.inclinacao * x;

    return (
        <ResponsiveContainer width="100%" height={380}>
            {/* top maior: o produto mais vendido fica no topo do gráfico e o ponto não pode ser cortado */}
            <ScatterChart margin={{ top: 32, right: 30, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    type="number"
                    dataKey="preco"
                    name="Preço"
                    domain={[xMin, xMax]}
                    tickFormatter={(valor: number) => `R$ ${valor}`}
                    label={{ value: "Preço do produto", position: "insideBottom", offset: -15 }}
                />
                <YAxis
                    type="number"
                    dataKey="unidades"
                    name="Unidades vendidas"
                    label={{ value: "Unidades vendidas", angle: -90, position: "insideLeft" }}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                {/* A reta de regressão: um segmento ligando os dois pontos extremos */}
                <ReferenceLine
                    segment={[
                        { x: xMin, y: yDaReta(xMin) },
                        { x: xMax, y: yDaReta(xMax) },
                    ]}
                    stroke="#c0392b"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    ifOverflow="extendDomain"
                />
                <Scatter name="Produtos" data={dados} fill="#8b5a2b">
                    {/* Escreve o nome do produto ao lado de cada ponto */}
                    <LabelList dataKey="produto" content={RotuloPonto} />
                </Scatter>
            </ScatterChart>
        </ResponsiveContainer>
    );
}