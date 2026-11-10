import { Router } from "express";
import type { Request, Response } from "express";
import { AutenticacaoServico } from "../servicos/AutenticacaoServico";
import { lerCamposTexto } from "../validadores/corpo";

// Rotas de autenticação (públicas: é aqui que a pessoa ainda vai pegar o token)
export function criarRotasAutenticacao(servico: AutenticacaoServico): Router {
    const rotas = Router();

    // POST /auth/login -> confere e-mail e senha e devolve { token, usuario }
    rotas.post("/login", async (req: Request, res: Response) => {
        const { email, senha } = lerCamposTexto(req.body, ["email", "senha"], "Informe e-mail e senha.");
        res.status(200).json(await servico.entrar(email, senha, req.ip ?? "")); // o IP entra na trava de tentativas
    });

    return rotas;
}
