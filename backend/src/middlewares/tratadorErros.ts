import type { NextFunction, Request, Response } from "express";
import { ErroAplicacao } from "../erros/ErroAplicacao";

// Lê uma propriedade de um erro desconhecido sem precisar de "any" (devolve undefined se não existir)
function ler(erro: unknown, propriedade: string): unknown {
    return typeof erro === "object" && erro !== null ? Reflect.get(erro, propriedade) : undefined;
}

// Códigos que o MySQL usa quando um dado não cabe na coluna (texto grande demais, caractere que a coluna não guarda,
// número fora do limite). Isso é culpa do que a pessoa enviou (400), não um defeito do servidor (500).
const CODIGOS_DE_DADO_INVALIDO = [
    "ER_DATA_TOO_LONG",
    "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD",
    "ER_WARN_DATA_OUT_OF_RANGE",
    "ER_DATA_OUT_OF_RANGE",
];

// Único lugar que transforma erro em resposta HTTP. Qualquer rota que lançar um erro cai aqui.
// Repare que ele só conhece a classe base ErroAplicacao: cada erro filho traz o seu próprio status.
export function tratadorErros(erro: unknown, _req: Request, res: Response, _next: NextFunction): void {
    // Erros "esperados" (validação, login, conflito...): responde com o status e a mensagem do erro
    if (erro instanceof ErroAplicacao) {
        res.status(erro.status).json({ erro: erro.message });
        return;
    }

    // Problemas do próprio corpo da requisição, detectados pelo Express antes de chegar na rota
    const tipo = ler(erro, "type");
    if (tipo === "entity.parse.failed") {
        res.status(400).json({ erro: "O corpo da requisição não é um JSON válido." });
        return;
    }
    if (tipo === "entity.too.large") {
        res.status(413).json({ erro: "O corpo da requisição é grande demais." });
        return;
    }
    if (tipo === "charset.unsupported" || tipo === "encoding.unsupported") {
        res.status(415).json({ erro: "Formato de envio não aceito. Envie JSON em UTF-8." });
        return;
    }

    // O banco recusou o dado por não caber na coluna: é entrada inválida, não erro nosso
    const codigo = ler(erro, "code");
    if (typeof codigo === "string" && CODIGOS_DE_DADO_INVALIDO.includes(codigo)) {
        res.status(400).json({ erro: "Algum campo tem texto ou número fora do que é permitido." });
        return;
    }

    // Qualquer outra coisa é erro nosso: detalhe só no terminal, mensagem genérica pra fora
    console.error(erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
}
