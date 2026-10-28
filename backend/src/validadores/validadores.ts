import { ErroValidacao } from "../erros/ErroValidacao"; // "../" = sobe uma pasta

// Regex = "molde" de texto: algo + @ + algo + . + algo, sem espaços
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Confere o e-mail; se estiver errado, lança o erro personalizado
export function validarEmail(email: string): string {
    const limpo = email.trim().toLowerCase(); // tira espaços e padroniza em minúsculo

    if (!REGEX_EMAIL.test(limpo)) {
        throw new ErroValidacao("E-mail inválido.");
    }

    return limpo; // devolve o e-mail já tratado
}

// Valida o CPF: confere tamanho, números repetidos e os 2 dígitos verificadores
export function validarCpf(cpf: string): string {
    const numeros = cpf.replace(/\D/g, ""); // \D = tudo que NÃO é dígito (tira pontos e traço)

    // Precisa ter 11 números e não pode ser tudo igual (ex: 111.111.111-11)
    if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
        throw new ErroValidacao("CPF inválido.");
    }

    // Calcula um dígito verificador usando os primeiros "tamanho" números
    const calcularDigito = (tamanho: number): number => {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) {
            soma += Number(numeros[i]) * (tamanho + 1 - i); // cada número tem um peso (10 a 2, ou 11 a 2)
        }
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto; // regra do CPF: resto 10 vira 0
    };

    // Compara os dígitos calculados com os 2 últimos do CPF digitado
    if (calcularDigito(9) !== Number(numeros[9]) || calcularDigito(10) !== Number(numeros[10])) {
        throw new ErroValidacao("CPF inválido.");
    }

    return numeros; // devolve só os 11 números, sem pontos e traço
}

// Valida o nível da senha: tamanho mínimo + maiúscula, minúscula, número e símbolo
export function validarSenha(senha: string): string {
    // Lista de regras: cada uma tem o teste e a mensagem de erro dela
    const regras = [
        { ok: senha.length >= 8, mensagem: "ter pelo menos 8 caracteres" },
        { ok: /[A-Z]/.test(senha), mensagem: "ter uma letra maiúscula" },
        { ok: /[a-z]/.test(senha), mensagem: "ter uma letra minúscula" },
        { ok: /\d/.test(senha), mensagem: "ter um número" },
        { ok: /[^A-Za-z0-9]/.test(senha), mensagem: "ter um símbolo (ex: @, #, !)" },
    ];

    // Pega só as regras que falharam
    const falhas = regras.filter((regra) => !regra.ok);

    // Se alguma falhou, lança o erro listando o que está faltando
    if (falhas.length > 0) {
        const faltando = falhas.map((regra) => regra.mensagem).join(", ");
        throw new ErroValidacao(`Senha fraca. A senha precisa: ${faltando}.`);
    }

    return senha; // senha forte: devolve igual (a criptografia vem depois)
}

// Valida o nome: tira espaços das pontas e exige pelo menos 2 caracteres
export function validarNome(nome: string): string {
    const limpo = nome.trim();

    if (limpo.length < 2) {
        throw new ErroValidacao("Nome inválido: precisa ter pelo menos 2 caracteres.");
    }

    return limpo;
}