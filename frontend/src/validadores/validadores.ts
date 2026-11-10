// Cada função devolve "" se o dado está OK, ou a mensagem de erro se não estiver

// Tamanhos máximos: os mesmos do back-end e das colunas do banco
const NOME_MAXIMO = 100;
const EMAIL_MAXIMO = 150;
const SENHA_MAXIMA = 64;

export function validarNome(nome: string): string {
    const tamanho = nome.trim().length;
    return tamanho < 2 || tamanho > NOME_MAXIMO ? `Informe um nome de 2 a ${NOME_MAXIMO} caracteres.` : "";
}

// Molde de e-mail: algo + @ + algo + . + algo, sem espaços
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email: string): string {
    const limpo = email.trim();
    return limpo.length <= EMAIL_MAXIMO && REGEX_EMAIL.test(limpo) ? "" : "Informe um e-mail válido.";
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
        { ok: senha.length <= SENHA_MAXIMA, mensagem: `ter no máximo ${SENHA_MAXIMA} caracteres` },
        { ok: /[A-Z]/.test(senha), mensagem: "ter uma letra maiúscula" },
        { ok: /[a-z]/.test(senha), mensagem: "ter uma letra minúscula" },
        { ok: /\d/.test(senha), mensagem: "ter um número" },
        { ok: /[^A-Za-z0-9]/.test(senha), mensagem: "ter um símbolo (ex: @, #, !)" },
    ];

    const faltando = regras.filter((regra) => !regra.ok).map((regra) => regra.mensagem);

    return faltando.length > 0 ? `A senha precisa: ${faltando.join(", ")}.` : "";
}

// No LOGIN a senha só precisa ter sido digitada (a força da senha só importa no cadastro)
export function validarSenhaObrigatoria(senha: string): string {
    return senha === "" ? "Informe a sua senha." : "";
}

// Confere se a senha e a confirmação são iguais (a "verificação dupla" da rubrica)
export function validarConfirmacao(senha: string, confirmacao: string): string {
    return senha === confirmacao ? "" : "As senhas não conferem.";
}

// ===== Validadores dos CRUDs (cada um devolve "" se está OK, ou a mensagem de erro) =====

// Tamanho do texto (os mesmos limites do back-end e das colunas do banco)
export function validarTamanho(valor: string, rotulo: string, minimo: number, maximo: number): string {
    const tamanho = valor.trim().length;
    if (tamanho < minimo) return `${rotulo} deve ter pelo menos ${minimo} caracteres.`;
    if (tamanho > maximo) return `${rotulo} deve ter no máximo ${maximo} caracteres.`;
    return "";
}

// Preço digitado: aceita "12,50" ou "12.50", maior que zero, até 2 casas decimais e no máximo 99.999,99
export function validarPrecoTexto(texto: string): string {
    const limpo = texto.trim().replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return "Informe um preço válido, com até 2 casas decimais (ex: 12,50).";
    const preco = Number(limpo);
    if (preco <= 0) return "O preço precisa ser maior que zero.";
    if (preco > 99999.99) return "O preço máximo é 99.999,99.";
    return "";
}

// Quantidade de itens: número inteiro de 1 a 999
export function validarQuantidadeTexto(texto: string): string {
    const limpo = texto.trim();
    if (!/^\d+$/.test(limpo)) return "Informe um número inteiro (ex: 2).";
    const quantidade = Number(limpo);
    if (quantidade < 1 || quantidade > 999) return "A quantidade deve ser de 1 a 999.";
    return "";
}
