// Transforma número em dinheiro brasileiro: 12961 -> "R$ 12.961,00"
export function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Transforma "2026-10-05" em "05/10" (dia/mês)
export function formatarDiaMes(data: string): string {
    const [, mes, dia] = data.split("-"); // o "," pula o ano
    return `${dia}/${mes}`;
}