import type { Pedido, StatusPedido } from "../entidades/Pedido";
import type { IRepositorioCrud } from "./IRepositorioCrud";

// Como o pedido aparece quando é LIDO do banco
export interface PedidoRegistro {
    id: number;
    idUsuario: number;
    atendente: string; // nome de quem registrou o pedido (vem do JOIN com usuario)
    cliente: string | null;
    status: StatusPedido;
    dataHora: string; // "2026-11-07 15:30:00" (preenchida pelo banco)
    quantidadeItens: number; // quantos itens (linhas) o pedido tem
    total: number; // soma de quantidade x preço de todos os itens (calculada na hora, nunca fica desatualizada)
}

// Contrato do repositório de pedidos: o CRUD genérico "preenchido" com os tipos do pedido
export interface IPedidoRepositorio extends IRepositorioCrud<Pedido, PedidoRegistro> {}
