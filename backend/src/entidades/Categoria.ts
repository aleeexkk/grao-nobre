import { validarTextoObrigatorio, validarTextoOpcional } from "../validadores/validadores";

// Classe que representa uma categoria do cardápio (Cafés, Pães, Doces...)
export class Categoria {
    // "private" = só a própria classe mexe nesses campos (encapsulamento)
    private _id: number | null; // null enquanto a categoria ainda não foi salva no banco
    private _nome: string;
    private _descricao: string | null; // opcional: pode ser null

    // Construtor: valida ANTES de guardar (não nasce categoria inválida)
    // Os limites (2 a 60 e 200) são os mesmos tamanhos das colunas no banco
    constructor(nome: string, descricao: string | null = null, id: number | null = null) {
        this._id = id;
        this._nome = validarTextoObrigatorio(nome, "Nome", 2, 60);
        this._descricao = validarTextoOpcional(descricao, "Descrição", 200);
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
        this._nome = validarTextoObrigatorio(valor, "Nome", 2, 60);
    }

    // descricao: lê e altera (aceita null pra "apagar" a descrição)
    get descricao(): string | null {
        return this._descricao;
    }
    set descricao(valor: string | null) {
        this._descricao = validarTextoOpcional(valor, "Descrição", 200);
    }
}