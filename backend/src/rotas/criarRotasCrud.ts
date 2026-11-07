import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { usuarioLogado } from "../middlewares/autenticar";
import type { ServicoCrudBase } from "../servicos/ServicoCrudBase";
import { lerFiltros, lerId, lerPaginacao } from "../validadores/corpo";

// Monta as 5 rotas padrão de um CRUD (criar, listar, buscar, editar, apagar), todas protegidas por login.
// É GENÉRICA: serve pra categoria, produto, pedido... Só muda o serviço e a função que lê o corpo da requisição.
//   TDados    = formato dos dados que chegam do front-end
//   TEntidade = classe que valida os dados
//   TRegistro = como o dado volta pro front-end
// Os erros não precisam de try/catch aqui: o tratador de erros (middleware) cuida de todos.
//
//   lerDados       = confere o corpo da requisição. Recebe também o id de quem está logado
//                    (o pedido precisa saber quem o registrou; os outros CRUDs ignoram).
//   filtrosAceitos = nomes de filtros opcionais da listagem (ex: ["idPedido"] aceita ?idPedido=5)
export function criarRotasCrud<TDados, TEntidade, TRegistro>(
    servico: ServicoCrudBase<TDados, TEntidade, TRegistro>,
    autenticar: RequestHandler,
    lerDados: (corpo: unknown, idUsuario: number) => TDados,
    filtrosAceitos: readonly string[] = []
): Router {
    const rotas = Router();

    // TODAS as rotas daqui pra baixo exigem login
    rotas.use(autenticar);

    // POST / -> cria
    rotas.post("/", async (req: Request, res: Response) => {
        const dados = lerDados(req.body, usuarioLogado(req).id);
        res.status(201).json(await servico.criar(dados)); // 201 = criado
    });

    // GET /?pagina=1&limite=10 -> lista com paginação (e filtros, se a rota aceitar)
    rotas.get("/", async (req: Request, res: Response) => {
        const { pagina, limite } = lerPaginacao(req.query);
        const filtros = lerFiltros(req.query, filtrosAceitos);
        res.json(await servico.listar(pagina, limite, filtros));
    });

    // GET /:id -> busca um
    rotas.get("/:id", async (req: Request, res: Response) => {
        res.json(await servico.buscar(lerId(req.params.id)));
    });

    // PUT /:id -> edita
    rotas.put("/:id", async (req: Request, res: Response) => {
        const id = lerId(req.params.id);
        const dados = lerDados(req.body, usuarioLogado(req).id);
        res.json(await servico.atualizar(id, dados));
    });

    // DELETE /:id -> apaga
    rotas.delete("/:id", async (req: Request, res: Response) => {
        await servico.excluir(lerId(req.params.id));
        res.status(204).send(); // 204 = deu certo e não há nada pra devolver
    });

    return rotas;
}
