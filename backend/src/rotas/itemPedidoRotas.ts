import type { RequestHandler, Router } from "express";
import { ItemPedidoServico } from "../servicos/ItemPedidoServico";
import type { DadosItemPedido } from "../servicos/ItemPedidoServico";
import { lerNumero } from "../validadores/corpo";
import { criarRotasCrud } from "./criarRotasCrud";

// Lê e confere o corpo: pedido, produto e quantidade são obrigatórios (e precisam ser números)
function lerDadosItem(corpo: unknown): DadosItemPedido {
    const idPedido = lerNumero(corpo, "idPedido", "Informe o pedido do item.");
    const idProduto = lerNumero(corpo, "idProduto", "Informe o produto do item.");
    const quantidade = lerNumero(corpo, "quantidade", "Informe a quantidade (um número).");
    return { idPedido, idProduto, quantidade };
}

// As 5 rotas vêm prontas da fábrica. A listagem aceita ?idPedido=5 (só os itens daquele pedido)
export function criarRotasItemPedido(servico: ItemPedidoServico, autenticar: RequestHandler): Router {
    return criarRotasCrud(servico, autenticar, lerDadosItem, ["idPedido"]);
}
