import { Router } from "express";
import type { Request, Response } from "express";
import { UsuarioServico } from "../servicos/UsuarioServico";
import { ErroValidacao } from "../erros/ErroValidacao";
import { ErroConflito } from "../erros/ErroConflito";

// Monta as rotas de usuário usando o serviço que recebemos de fora
export function criarRotasUsuario(servico: UsuarioServico): Router {
    const rotas = Router();

    // POST /usuarios -> cadastra um usuário novo
    rotas.post("/", async (req: Request, res: Response) => {
        // Pega os campos do corpo da requisição (se não veio corpo, usa objeto vazio)
        const { nome, email, senha, cpf } = req.body ?? {};

        // Os 4 campos são obrigatórios e precisam ser texto
        if (
            typeof nome !== "string" ||
            typeof email !== "string" ||
            typeof senha !== "string" ||
            typeof cpf !== "string"
        ) {
            res.status(400).json({ erro: "Informe nome, e-mail, senha e CPF." });
            return;
        }

        try {
            const criado = await servico.cadastrar({ nome, email, senha, cpf });
            res.status(201).json(criado); // 201 = criado com sucesso
        } catch (erro) {
            if (erro instanceof ErroValidacao) {
                res.status(400).json({ erro: erro.message }); // dado inválido
                return;
            }
            if (erro instanceof ErroConflito) {
                res.status(409).json({ erro: erro.message }); // já existe
                return;
            }
            console.error(erro); // detalhe fica só no terminal do servidor
            res.status(500).json({ erro: "Erro interno no servidor." }); // não vaza detalhes pra fora
        }
    });

    return rotas;
}