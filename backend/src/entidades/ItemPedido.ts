import { validarIdPositivo, validarQuantidade } from "../validadores/validadores";

// Classe que representa UM item de um pedido: "2 cafés expressos no pedido 15".
// O preço NÃO é informado aqui: o banco copia o preço do produto no momento em que o item entra
// (assim, se o produto ficar mais caro depois, os pedidos antigos continuam com o valor certo).
export class ItemPedido {
    private _id: number | null; // null enquanto o item ainda não foi salvo
    private _idPedido: number;
    private _idProduto: number;
    private _quantidade: number;

    constructor(idPedido: number, idProduto: number, quantidade: number, id: number | null = null) {
        this._id = id;
        this._idPedido = validarIdPositivo(idPedido, "Pedido inválido.");
        this._idProduto = validarIdPositivo(idProduto, "Produto inválido.");
        this._quantidade = validarQuantidade(quantidade);
    }

    get id(): number | null {
        return this._id;
    }

    get idPedido(): number {
        return this._idPedido;
    }
    set idPedido(valor: number) {
        this._idPedido = validarIdPositivo(valor, "Pedido inválido.");
    }

    get idProduto(): number {
        return this._idProduto;
    }
    set idProduto(valor: number) {
        this._idProduto = validarIdPositivo(valor, "Produto inválido.");
    }

    get quantidade(): number {
        return this._quantidade;
    }
    set quantidade(valor: number) {
        this._quantidade = validarQuantidade(valor);
    }
}
