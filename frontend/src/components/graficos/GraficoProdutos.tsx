import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import type { ItemRanking } from "../../estatisticas/metricas";

interface GraficoProdutosProps {
    dados: ItemRanking[]; // o ranking calculado nas métricas
}

// Gráfico de barras: quantas unidades cada produto vendeu
export default function GraficoProdutos({ dados }: GraficoProdutosProps) {
    return (
        // ResponsiveContainer faz o gráfico se ajustar à largura do cartão
        <ResponsiveContainer width="100%" height={340}>
            <BarChart data={dados} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* dataKey = qual campo do dado vai em cada eixo */}
                <XAxis dataKey="produto" angle={-30} textAnchor="end" interval={0} height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="unidades" name="Unidades vendidas" fill="#8b5a2b" />
            </BarChart>
        </ResponsiveContainer>
    );
}