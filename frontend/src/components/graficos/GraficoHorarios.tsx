import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import type { VendasHora } from "../../estatisticas/metricas";

interface GraficoHorariosProps {
    dados: VendasHora[]; // unidades vendidas em cada hora (7h às 19h)
}

// Histograma: quantas unidades saem em cada faixa de 1 hora
export default function GraficoHorarios({ dados }: GraficoHorariosProps) {
    // Descobre qual é o maior valor, pra pintar essa barra de outra cor
    const maior = Math.max(...dados.map((d) => d.unidades));

    return (
        <ResponsiveContainer width="100%" height={340}>
            {/* barCategoryGap pequeno = barras coladinhas (cara de histograma) */}
            <BarChart data={dados} barCategoryGap={2} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" tickFormatter={(hora: number) => `${hora}h`} />
                <YAxis />
                <Tooltip labelFormatter={(hora) => `Das ${hora}h às ${Number(hora) + 1}h`} />
                <Bar dataKey="unidades" name="Unidades vendidas">
                    {/* Cell = uma cor pra cada barra: vermelho no pico, marrom nas demais */}
                    {dados.map((d) => (
                        <Cell key={d.hora} fill={d.unidades === maior ? "#c0392b" : "#8b5a2b"} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}