// Converte o texto digitado num preço: "12,50" -> 12.5 (aceita vírgula ou ponto).
// Só use depois de validarPrecoTexto (que garante que o texto é um preço válido).
export function lerPreco(texto: string): number {
    return Number(texto.trim().replace(",", "."));
}

// Mostra um preço no campo do formulário: 6 -> "6,00"
export function precoParaCampo(preco: number): string {
    return preco.toFixed(2).replace(".", ",");
}

// Lê o ":id" que vem na URL (ex: "/produtos/5/editar" -> 5). Devolve null se não tiver id (tela de cadastro).
// Se o texto não for um número (ex: "/produtos/abc/editar"), devolve 0 e a API responde "Id inválido".
export function lerIdDaRota(texto: string | undefined): number | null {
    if (texto === undefined) return null;
    const numero = Number(texto);
    return Number.isInteger(numero) && numero > 0 ? numero : 0;
}
