import {
    validarTextoObrigatorio,
    validarTextoOpcional,
    validarPreco,
    validarIdPositivo,
} from "../validadores/validadores";

// Classe que representa um produto do cardápio (Café Expresso, Pão de Queijo...)
export class Produto {
    // "private" = só a própria classe mexe nesses campos (encapsulamento)
    private _id: number | null; // null enquanto o produto ainda não foi salvo no banco
    private _nome: string;
    private _descricao: string | null; // opcional
    private _preco: number;
    private _idCategoria: number; // a "gaveta" (categoria) onde o produto fica

    // Construtor: valida ANTES de guardar (não nasce produto inválido)
    // Os limites (2 a 100 e 255) são os mesmos tamanhos das colunas no banco
    constructor(
        nome: string,
        descricao: string | null,
        preco: number,
        idCategoria: number,
        id: number | null = null
    ) {
        this._id = id;
        this._nome = validarTextoObrigatorio(nome, "Nome", 2, 100);
        this._descricao = validarTextoOpcional(descricao, "Descrição", 255);
        this._preco = validarPreco(preco);
        this._idCategoria = validarIdPositivo(idCategoria, "Categoria inválida.");
    }

    // id: só leitura (quem define é o banco)
    get id(): number | null {
        return this._id;
    }

    get nome(): string {
        return this._nome;
    }
    set nome(valor: string) {
        this._nome = validarTextoObrigatorio(valor, "Nome", 2, 100);
    }

    get descricao(): string | null {
        return this._descricao;
    }
    set descricao(valor: string | null) {
        this._descricao = validarTextoOpcional(valor, "Descrição", 255);
    }

    get preco(): number {
        return this._preco;
    }
    set preco(valor: number) {
        this._preco = validarPreco(valor);
    }

    get idCategoria(): number {
        return this._idCategoria;
    }
    set idCategoria(valor: number) {
        this._idCategoria = validarIdPositivo(valor, "Categoria inválida.");
    }
}
