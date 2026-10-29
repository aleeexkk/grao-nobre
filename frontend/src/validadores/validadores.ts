// Cada função devolve "" se o dado está OK, ou a mensagem de erro se não estiver

export function validarNome(nome: string): string {
    return nome.trim().length < 2 ? "Informe um nome com pelo menos 2 caracteres." : "";
}

// Molde de e-mail: algo + @ + algo + . + algo, sem espaços
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email: string): string {
    return REGEX_EMAIL.test(email.trim()) ? "" : "Informe um e-mail válido.";
}

export function validarCpf(cpf: string): string {
    const numeros = cpf.replace(/\D/g, ""); // tira tudo que não é número

    // Precisa ter 11 números e não pode ser tudo igual (ex: 111.111.111-11)
    if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
        return "CPF inválido.";
    }

    // Calcula um dígito verificador usando os primeiros "tamanho" números
    const calcularDigito = (tamanho: number): number => {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) {
            soma += Number(numeros[i]) * (tamanho + 1 - i);
        }
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    // Compara os dígitos calculados com os 2 últimos do CPF digitado
    if (calcularDigito(9) !== Number(numeros[9]) || calcularDigito(10) !== Number(numeros[10])) {
        return "CPF inválido.";
    }

    return "";
}

// Mesmas regras de senha do back-end: tamanho, maiúscula, minúscula, número e símbolo
export function validarSenha(senha: string): string {
    const regras = [
        { ok: senha.length >= 8, mensagem: "ter pelo menos 8 caracteres" },
        { ok: /[A-Z]/.test(senha), mensagem: "ter uma letra maiúscula" },
        { ok: /[a-z]/.test(senha), mensagem: "ter uma letra minúscula" },
        { ok: /\d/.test(senha), mensagem: "ter um número" },
        { ok: /[^A-Za-z0-9]/.test(senha), mensagem: "ter um símbolo (ex: @, #, !)" },
    ];

    const faltando = regras.filter((regra) => !regra.ok).map((regra) => regra.mensagem);

    return faltando.length > 0 ? `A senha precisa: ${faltando.join(", ")}.` : "";
}

// Confere se a senha e a confirmação são iguais (a "verificação dupla" da rubrica)
export function validarConfirmacao(senha: string, confirmacao: string): string {
    return senha === confirmacao ? "" : "As senhas não conferem.";
}