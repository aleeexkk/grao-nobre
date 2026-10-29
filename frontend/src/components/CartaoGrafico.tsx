import type { ReactNode } from "react";

interface CartaoGraficoProps {
    titulo: string;
    descricao?: string; // frase explicando o que o gráfico mostra
    children: ReactNode; // "children" = o que for colocado dentro do cartão (o gráfico)
}

// Moldura genérica pra qualquer gráfico: título, descrição e o gráfico dentro
export default function CartaoGrafico({ titulo, descricao, children }: CartaoGraficoProps) {
    return (
        <section className="cartao-grafico">
            <h2>{titulo}</h2>
            {descricao && <p>{descricao}</p>}
            {children}
        </section>
    );
}