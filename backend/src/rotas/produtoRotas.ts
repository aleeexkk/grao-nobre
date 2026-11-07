import type { RequestHandler, Router } from "express";
import { ProdutoServico } from "../servicos/ProdutoServico";
import type { DadosProduto } from "../servicos/ProdutoServico";
import { lerCamposTexto, lerNumero, lerTextoOpcional } from "../validadores/corpo";
import { criarRotasCrud } from "./criarRotasCrud";

// Lê e confere o corpo: nome, preço e categoria obrigatórios; descrição opcional
function lerDadosProduto(corpo: unknown): DadosProduto {
    const { nome } = lerCamposTexto(corpo, ["nome"], "Informe o nome do produto.");
    const descricao = lerTextoOpcional(corpo, "descricao", "A descrição precisa ser um texto.");
    const preco = lerNumero(corpo, "preco", "Informe o preço (um número).");
    const idCategoria = lerNumero(corpo, "idCategoria", "Informe a categoria do produto.");
    return { nome, descricao, preco, idCategoria };
}

// As 5 rotas vêm prontas da fábrica; aqui só dizemos como ler o corpo do produto
export function criarRotasProduto(servico: ProdutoServico, autenticar: RequestHandler): Router {
    return criarRotasCrud(servico, autenticar, lerDadosProduto);
}
