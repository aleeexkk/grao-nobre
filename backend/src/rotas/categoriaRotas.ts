import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { CategoriaServico } from "../servicos/CategoriaServico";
import type { DadosCategoria } from "../servicos/CategoriaServico";
import { lerCamposTexto, lerId, lerPaginacao, lerTextoOpcional } from "../validadores/corpo";

// Lê e confere o corpo (nome obrigatório, descrição opcional). Usado no criar e no editar
function lerDadosCategoria(corpo: unknown): DadosCategoria {
    const { nome } = lerCamposTexto(corpo, ["nome"], "Informe o nome da categoria.");
    const descricao = lerTextoOpcional(corpo, "descricao", "A descrição precisa ser um texto.");
    return { nome, descricao };
}

// Monta as rotas de categoria. "autenticar" é o porteiro que barra quem não está logado.
// Os erros não precisam de try/catch aqui: o tratador de erros (middleware) cuida de todos.
export function criarRotasCategoria(servico: CategoriaServico, autenticar: RequestHandler): Router {
    const rotas = Router();

    // TODAS as rotas daqui pra baixo exigem login
    rotas.use(autenticar);

    // POST /categorias -> cria
    rotas.post("/", async (req: Request, res: Response) => {
        res.status(201).json(await servico.criar(lerDadosCategoria(req.body))); // 201 = criado
    });

    // GET /categorias?pagina=1&limite=10 -> lista com paginação
    rotas.get("/", async (req: Request, res: Response) => {
        const { pagina, limite } = lerPaginacao(req.query);
        res.json(await servico.listar(pagina, limite));
    });

    // GET /categorias/:id -> busca uma
    rotas.get("/:id", async (req: Request, res: Response) => {
        res.json(await servico.buscar(lerId(req.params.id)));
    });

    // PUT /categorias/:id -> edita
    rotas.put("/:id", async (req: Request, res: Response) => {
        const id = lerId(req.params.id);
        res.json(await servico.atualizar(id, lerDadosCategoria(req.body)));
    });

    // DELETE /categorias/:id -> apaga
    rotas.delete("/:id", async (req: Request, res: Response) => {
        await servico.excluir(lerId(req.params.id));
        res.status(204).send(); // 204 = deu certo e não há nada pra devolver
    });

    return rotas;
}