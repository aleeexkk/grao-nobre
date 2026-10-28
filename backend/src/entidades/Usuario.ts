import { validarNome, validarEmail, validarSenha, validarCpf } from "../validadores/validadores";

// Classe que representa um usuário do sistema
export class Usuario {
    // "private" = só a própria classe mexe nesses campos (encapsulamento)
    private _id: number | null; // null enquanto o usuário ainda não foi salvo no banco
    private _nome: string;
    private _email: string;
    private _senha: string;
    private _cpf: string;

    // Construtor: valida cada dado ANTES de guardar (não nasce usuário inválido)
    constructor(
        nome: string,
        email: string,
        senha: string,
        cpf: string,
        id: number | null = null
    ) {
        this._id = id;
        this._nome = validarNome(nome);
        this._email = validarEmail(email);
        this._senha = validarSenha(senha);
        this._cpf = validarCpf(cpf);
    }

    // id: só leitura (quem define é o banco)
    get id(): number | null {
        return this._id;
    }

    // nome: lê e altera, mas a alteração passa pela validação
    get nome(): string {
        return this._nome;
    }
    set nome(valor: string) {
        this._nome = validarNome(valor);
    }

    // email: só leitura, sem setter (não pode ser alterado depois de criado)
    get email(): string {
        return this._email;
    }

    // cpf: lê e altera, com validação
    get cpf(): string {
        return this._cpf;
    }
    set cpf(valor: string) {
        this._cpf = validarCpf(valor);
    }

    // senha: só setter (dá pra trocar, mas ninguém consegue ler de fora)
    set senha(valor: string) {
        this._senha = validarSenha(valor);
    }
}