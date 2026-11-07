import { requisicao } from "./api";
import { criarClienteCrud } from "./crud";
import type { Venda } from "../estatisticas/tipos";

// ===== Categorias =====
export interface Categoria {
    id: number;
    nome: string;
    descricao: string | null;
}
export interface DadosCategoria {
    nome: string;
    descricao: string | null;
}
export const clienteCategorias = criarClienteCrud<Categoria, DadosCategoria>("/categorias");

// ===== Produtos =====
export interface Produto {
    id: number;
    nome: string;
    descricao: string | null;
    preco: number;
    idCategoria: number;
    categoria: string; // nome da categoria (a API já manda junto)
}
export interface DadosProduto {
    nome: string;
    descricao: string | null;
    preco: number;
    idCategoria: number;
}
export const clienteProdutos = criarClienteCrud<Produto, DadosProduto>("/produtos");

// ===== Pedidos =====
export type StatusPedido = "aberto" | "pago" | "cancelado";
export interface Pedido {
    id: number;
    idUsuario: number;
    atendente: string;
    cliente: string | null;
    status: StatusPedido;
    dataHora: string; // "2026-11-07 15:30:00"
    quantidadeItens: number;
    total: number;
}
export interface DadosPedido {
    cliente: string | null;
    status: StatusPedido;
}
export const clientePedidos = criarClienteCrud<Pedido, DadosPedido>("/pedidos");

// ===== Itens do pedido =====
export interface ItemPedido {
    id: number;
    idPedido: number;
    idProduto: number;
    produto: string; // nome do produto
    quantidade: number;
    precoUnitario: number; // preço do produto na hora em que o item entrou no pedido
    subtotal: number;
}
export interface DadosItemPedido {
    idPedido: number;
    idProduto: number;
    quantidade: number;
}
export const clienteItensPedido = criarClienteCrud<ItemPedido, DadosItemPedido>("/itens-pedido");

// ===== Estatísticas =====
export interface RespostaVendas {
    dias: number;
    vendas: Venda[];
}

// Vendas reais (itens de pedidos PAGOS) dos últimos "dias" dias
export function buscarVendas(dias: number): Promise<RespostaVendas> {
    return requisicao<RespostaVendas>("GET", `/estatisticas/vendas?dias=${dias}`, undefined, true);
}
