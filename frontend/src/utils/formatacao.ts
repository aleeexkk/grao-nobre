// Transforma número em dinheiro brasileiro: 12961 -> "R$ 12.961,00"
export function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}