import type { RequestHandler, Router } from "express";
import { PedidoServico } from "../servicos/PedidoServico";
import type { DadosPedido } from "../servicos/PedidoServico";
import { lerTextoOpcional } from "../validadores/corpo";
import { criarRotasCrud } from "./criarRotasCrud";

// Lê e confere o corpo: cliente e status são opcionais (sem status, o pedido é "aberto").
// Quem registrou o pedido NÃO vem do corpo: vem do token de quem está logado (ninguém registra "em nome de outro")
function lerDadosPedido(corpo: unknown, idUsuario: number): DadosPedido {
    const cliente = lerTextoOpcional(corpo, "cliente", "O cliente precisa ser um texto.");
    const status = lerTextoOpcional(corpo, "status", "O status precisa ser um texto.") ?? "aberto";
    return { idUsuario, cliente, status };
}

// As 5 rotas vêm prontas da fábrica; aqui só dizemos como ler o corpo do pedido
export function criarRotasPedido(servico: PedidoServico, autenticar: RequestHandler): Router {
    return criarRotasCrud(servico, autenticar, lerDadosPedido);
}
