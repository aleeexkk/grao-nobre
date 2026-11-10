import type { RequestHandler } from "express";

// Põe cabeçalhos de segurança em TODA resposta da API. É um JSON puro, então dá pra ser bem restritivo.
export const cabecalhosDeSeguranca: RequestHandler = (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff"); // o navegador não "adivinha" outro tipo de arquivo
    res.setHeader("Cache-Control", "no-store"); // dados da API (e do usuário) não ficam guardados em cache
    res.setHeader("Referrer-Policy", "no-referrer"); // não conta de qual página veio a chamada
    res.setHeader("X-Frame-Options", "DENY"); // a resposta não pode ser aberta dentro de um <iframe>
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"); // a API nunca carrega nada
    next();
};
