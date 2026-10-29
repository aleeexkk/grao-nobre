interface CartaoMetricaProps {
    titulo: string; // nome da métrica
    valor: string; // o número grande (já formatado)
    descricao?: string; // linha extra opcional embaixo
}

// Componente genérico: um cartão com título, valor e uma observação
export default function CartaoMetrica({ titulo, valor, descricao }: CartaoMetricaProps) {
    return (
        <div className="cartao-metrica">
            <span className="cartao-titulo">{titulo}</span>
            <strong className="cartao-valor">{valor}</strong>
            {descricao && <small className="cartao-descricao">{descricao}</small>}
        </div>
    );
}