import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { EstatisticaServico } from "../servicos/EstatisticaServico";
import { lerDias } from "../validadores/corpo";

// GET /estatisticas/vendas?dias=30 -> as vendas reais (itens de pedidos pagos) dos últimos N dias
export function criarRotasEstatistica(servico: EstatisticaServico, autenticar: RequestHandler): Router {
    const rotas = Router();

    rotas.use(autenticar); // só quem está logado vê o faturamento

    rotas.get("/vendas", async (req: Request, res: Response) => {
        const dias = lerDias(req.query);
        res.json({ dias, vendas: await servico.vendas(dias) });
    });

    return rotas;
}
