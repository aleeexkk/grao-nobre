import express from "express";
import type { Express } from "express";
import cors from "cors";
import { UsuarioServico } from "./servicos/UsuarioServico";
import { AutenticacaoServico } from "./servicos/AutenticacaoServico";
import { TokenServico } from "./servicos/TokenServico";
import { criarAutenticacao } from "./middlewares/autenticar";
import { tratadorErros } from "./middlewares/tratadorErros";
import { criarRotasAutenticacao } from "./rotas/autenticacaoRotas";
import { criarRotasUsuario } from "./rotas/usuarioRotas";

// Tudo que o app precisa receber "de fora" (injeção de dependência)
export interface Dependencias {
    usuarioServico: UsuarioServico;
    autenticacaoServico: AutenticacaoServico;
    tokenServico: TokenServico;
}

// Monta o aplicativo Express SEM ligar o servidor (assim os testes conseguem usar o app sozinho)
export function criarApp(dependencias: Dependencias): Express {
    const app = express();

    app.use(cors()); // deixa o front-end (outra porta) chamar a API
    app.use(express.json()); // faz o servidor entender JSON no corpo das requisições

    const autenticar = criarAutenticacao(dependencias.tokenServico);

    app.use("/auth", criarRotasAutenticacao(dependencias.autenticacaoServico));
    app.use("/usuarios", criarRotasUsuario(dependencias.usuarioServico, autenticar));

    // Rota que não existe: responde em JSON (e não com a página de erro padrão do Express)
    app.use((_req, res) => {
        res.status(404).json({ erro: "Rota não encontrada." });
    });

    app.use(tratadorErros); // sempre por último: pega os erros de todas as rotas acima

    return app;
}
