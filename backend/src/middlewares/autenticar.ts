import type { Request, RequestHandler } from "express";
import { TokenServico } from "../servicos/TokenServico";
import type { DadosToken } from "../servicos/TokenServico";
import { ErroNaoAutorizado } from "../erros/ErroNaoAutorizado";

// Cria o "porteiro" das rotas protegidas: só deixa passar quem mandou um token válido.
// O token vem no cabeçalho:  Authorization: Bearer <token>
export function criarAutenticacao(tokens: TokenServico): RequestHandler {
    return (req, _res, next) => {
        const cabecalho = req.headers.authorization;

        if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
            throw new ErroNaoAutorizado("Faça login para continuar.");
        }

        // Confere o token; se for falso ou vencido, já lança 401 aqui
        req.usuarioAutenticado = tokens.validar(cabecalho.slice("Bearer ".length).trim());
        next(); // passou: segue para a rota
    };
}

// Pega "quem está logado" dentro de uma rota protegida
export function usuarioLogado(req: Request): DadosToken {
    if (!req.usuarioAutenticado) {
        throw new ErroNaoAutorizado("Faça login para continuar.");
    }
    return req.usuarioAutenticado;
}
