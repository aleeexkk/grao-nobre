import type { NextFunction, Request, Response } from "express";
import { ErroAplicacao } from "../erros/ErroAplicacao";

// Único lugar que transforma erro em resposta HTTP. Qualquer rota que lançar um erro cai aqui.
// Repare que ele só conhece a classe base ErroAplicacao: cada erro filho traz o seu próprio status.
export function tratadorErros(erro: unknown, _req: Request, res: Response, _next: NextFunction): void {
    // Erros "esperados" (validação, login, conflito...): responde com o status e a mensagem do erro
    if (erro instanceof ErroAplicacao) {
        res.status(erro.status).json({ erro: erro.message });
        return;
    }

    // JSON mal formado no corpo da requisição
    if (typeof erro === "object" && erro !== null && "type" in erro && erro.type === "entity.parse.failed") {
        res.status(400).json({ erro: "O corpo da requisição não é um JSON válido." });
        return;
    }

    // Qualquer outra coisa é erro nosso: detalhe só no terminal, mensagem genérica pra fora
    console.error(erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
}
