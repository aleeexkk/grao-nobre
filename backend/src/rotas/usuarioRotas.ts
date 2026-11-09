import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { UsuarioServico } from "../servicos/UsuarioServico";
import { usuarioLogado } from "../middlewares/autenticar";
import { lerCamposTexto, lerId } from "../validadores/corpo";

// Monta as rotas de usuário. "autenticar" é o porteiro que barra quem não está logado.
// Os erros não precisam de try/catch aqui: o tratador de erros (middleware) cuida de todos.
export function criarRotasUsuario(servico: UsuarioServico, autenticar: RequestHandler): Router {
    const rotas = Router();

    // POST /usuarios -> cadastra um usuário novo (pública)
    rotas.post("/", async (req: Request, res: Response) => {
        // Os 4 campos são obrigatórios e precisam ser texto
        const dados = lerCamposTexto(req.body, ["nome", "email", "senha", "cpf"], "Informe nome, e-mail, senha e CPF.");
        res.status(201).json(await servico.cadastrar(dados)); // 201 = criado com sucesso
    });

    // GET /usuarios/me -> dados de quem está logado (protegida)
    // (fica ANTES de "/:id" pra "me" não ser lido como se fosse um id)
    rotas.get("/me", autenticar, async (req: Request, res: Response) => {
        res.json(await servico.buscarPerfil(usuarioLogado(req).id));
    });

    // PUT /usuarios/:id -> edita o usuário (protegida; só o próprio usuário)
    rotas.put("/:id", autenticar, async (req: Request, res: Response) => {
        const logado = usuarioLogado(req);
        const idAlvo = lerId(req.params.id);

        // Todos os 4 campos são obrigatórios (o e-mail precisa vir, mas o serviço só aceita o MESMO e-mail de sempre)
        const dados = lerCamposTexto(req.body, ["nome", "email", "cpf", "senha"], "Informe nome, e-mail, CPF e senha.");

        res.json(await servico.atualizar(logado.id, idAlvo, dados));
    });

    return rotas;
}
