import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
} from "recharts";
import type { FaturamentoDia } from "../../estatisticas/metricas";
import { formatarMoeda, formatarDiaMes } from "../../utils/formatacao";

interface GraficoFaturamentoDiaProps {
    dados: FaturamentoDia[]; // um ponto por dia
    mediaDiaria: number; // onde desenhar a linha tracejada
}

// Gráfico de linha: faturamento de cada dia (série temporal)
export default function GraficoFaturamentoDia({ dados, mediaDiaria }: GraficoFaturamentoDiaProps) {
    return (
        <ResponsiveContainer width="100%" height={340}>
            <LineChart data={dados} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* tickFormatter muda como o texto do eixo aparece */}
                <XAxis dataKey="data" tickFormatter={formatarDiaMes} />
                <YAxis tickFormatter={(valor: number) => `R$ ${valor}`} />
                <Tooltip
                    formatter={(valor) => formatarMoeda(Number(valor))}
                    labelFormatter={(rotulo) => `Dia ${formatarDiaMes(String(rotulo))}`}
                />
                {/* Linha horizontal tracejada na média */}
                <ReferenceLine
                    y={mediaDiaria}
                    stroke="#999999"
                    strokeDasharray="6 4"
                    label={{ value: "Média diária", position: "insideTopRight" }}
                />
                <Line
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento"
                    stroke="#8b5a2b"
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}