// Transforma número em dinheiro brasileiro: 12961 -> "R$ 12.961,00"
export function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Transforma "2026-10-05" em "05/10" (dia/mês)
export function formatarDiaMes(data: string): string {
    const [, mes, dia] = data.split("-"); // o "," pula o ano
    return `${dia}/${mes}`;
}

// Transforma "52998224725" em "529.982.247-25" (se não tiver 11 números, devolve como veio)
export function formatarCpf(cpf: string): string {
    const numeros = cpf.replace(/\D/g, "");
    if (numeros.length !== 11) return cpf;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

// Pega só o primeiro nome: "Ana Lima Souza" -> "Ana"
export function primeiroNome(nomeCompleto: string): string {
    return nomeCompleto.trim().split(/\s+/)[0] ?? "";
}

// Formata número com vírgula decimal: -0.2361 -> "-0,24" (casas = quantas casas decimais)
export function formatarNumero(valor: number, casas: number): string {
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
    });
}