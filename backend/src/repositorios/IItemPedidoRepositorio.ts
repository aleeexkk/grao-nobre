import type { ItemPedido } from "../entidades/ItemPedido";
import type { IRepositorioCrud } from "./IRepositorioCrud";

// Como o item aparece quando é LIDO do banco
export interface ItemPedidoRegistro {
    id: number;
    idPedido: number;
    idProduto: number;
    produto: string; // nome do produto (vem do JOIN, só pra mostrar na tela)
    quantidade: number;
    precoUnitario: number; // preço do produto NO MOMENTO em que o item entrou no pedido
    subtotal: number; // quantidade x preço unitário
}

// Contrato do repositório de itens: o CRUD genérico "preenchido" com os tipos do item
export interface IItemPedidoRepositorio extends IRepositorioCrud<ItemPedido, ItemPedidoRegistro> {}
