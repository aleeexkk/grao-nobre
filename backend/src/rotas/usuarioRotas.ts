import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { UsuarioServico } from "../servicos/UsuarioServico";
import { usuarioLogado } from "../middlewares/autenticar";
import { lerCamposTexto, lerId } from "../validadores/corpo";
import { ErroValidacao } from "../erros/ErroValidacao";

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

        // Nome, CPF e senha são obrigatórios
        const { nome, cpf, senha } = lerCamposTexto(req.body, ["nome", "cpf", "senha"], "Informe nome, CPF e senha.");

        // E-mail é opcional no corpo, mas se vier tem que ser texto (o serviço confere se é o mesmo)
        const emailBruto = (req.body as Record<string, unknown>).email;
        if (emailBruto !== undefined && typeof emailBruto !== "string") {
            throw new ErroValidacao("Não é permitido alterar o e-mail.");
        }

        res.json(await servico.atualizar(logado.id, idAlvo, { nome, cpf, senha, email: emailBruto }));
    });

    return rotas;
}
