import type { StatusPedido } from "../servicos/recursos";

const ROTULOS: Record<StatusPedido, string> = {
    aberto: "Aberto",
    pago: "Pago",
    cancelado: "Cancelado",
};

// "Etiqueta" colorida com o status do pedido (a cor vem da classe CSS etiqueta-aberto / -pago / -cancelado)
export default function EtiquetaStatus({ status }: { status: StatusPedido }) {
    return <span className={`etiqueta etiqueta-${status}`}>{ROTULOS[status]}</span>;
}
