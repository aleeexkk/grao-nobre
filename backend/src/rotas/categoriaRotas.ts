import type { RequestHandler, Router } from "express";
import { CategoriaServico } from "../servicos/CategoriaServico";
import type { DadosCategoria } from "../servicos/CategoriaServico";
import { lerCamposTexto, lerTextoOpcional } from "../validadores/corpo";
import { criarRotasCrud } from "./criarRotasCrud";

// Lê e confere o corpo (nome obrigatório, descrição opcional)
function lerDadosCategoria(corpo: unknown): DadosCategoria {
    const { nome } = lerCamposTexto(corpo, ["nome"], "Informe o nome da categoria.");
    const descricao = lerTextoOpcional(corpo, "descricao", "A descrição precisa ser um texto.");
    return { nome, descricao };
}

// As 5 rotas vêm prontas da fábrica; aqui só dizemos como ler o corpo da categoria
export function criarRotasCategoria(servico: CategoriaServico, autenticar: RequestHandler): Router {
    return criarRotasCrud(servico, autenticar, lerDadosCategoria);
}
