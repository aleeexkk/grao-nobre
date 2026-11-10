import express from "express";
import type { Express } from "express";
import cors from "cors";
import { UsuarioServico } from "./servicos/UsuarioServico";
import { CategoriaServico } from "./servicos/CategoriaServico";
import { ProdutoServico } from "./servicos/ProdutoServico";
import { PedidoServico } from "./servicos/PedidoServico";
import { ItemPedidoServico } from "./servicos/ItemPedidoServico";
import { EstatisticaServico } from "./servicos/EstatisticaServico";
import { AutenticacaoServico } from "./servicos/AutenticacaoServico";
import { TokenServico } from "./servicos/TokenServico";
import { criarAutenticacao } from "./middlewares/autenticar";
import { cabecalhosDeSeguranca } from "./middlewares/cabecalhosDeSeguranca";
import { tratadorErros } from "./middlewares/tratadorErros";
import { criarRotasAutenticacao } from "./rotas/autenticacaoRotas";
import { criarRotasUsuario } from "./rotas/usuarioRotas";
import { criarRotasCategoria } from "./rotas/categoriaRotas";
import { criarRotasProduto } from "./rotas/produtoRotas";
import { criarRotasPedido } from "./rotas/pedidoRotas";
import { criarRotasItemPedido } from "./rotas/itemPedidoRotas";
import { criarRotasEstatistica } from "./rotas/estatisticaRotas";

// Tudo que o app precisa receber "de fora" (injeção de dependência)
export interface Dependencias {
    usuarioServico: UsuarioServico;
    categoriaServico: CategoriaServico;
    produtoServico: ProdutoServico;
    pedidoServico: PedidoServico;
    itemPedidoServico: ItemPedidoServico;
    estatisticaServico: EstatisticaServico;
    autenticacaoServico: AutenticacaoServico;
    tokenServico: TokenServico;
}

// Endereços de site que podem chamar a API pelo navegador (CORS). O padrão cobre o front no modo de
// desenvolvimento (5173), no "vite preview" (4173) e no Docker (8080). Dá pra trocar pela variável CORS_ORIGIN.
export const ORIGENS_PADRAO: readonly string[] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
];

// Monta o aplicativo Express SEM ligar o servidor (assim os testes conseguem usar o app sozinho)
export function criarApp(dependencias: Dependencias, origensPermitidas: readonly string[] = ORIGENS_PADRAO): Express {
    const app = express();

    app.disable("x-powered-by"); // não conta pra todo mundo que o servidor usa Express
    app.use(cabecalhosDeSeguranca); // cabeçalhos de segurança em todas as respostas
    app.use(
        cors({
            origin: [...origensPermitidas], // só esses sites (não "qualquer um") podem chamar a API pelo navegador
            methods: ["GET", "POST", "PUT", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
            maxAge: 600, // o navegador pode lembrar a permissão por 10 minutos
        })
    );
    app.use(express.json({ limit: "10kb" })); // entende JSON no corpo (10 KB é bem mais que qualquer formulário daqui)

    const autenticar = criarAutenticacao(dependencias.tokenServico);

    app.use("/auth", criarRotasAutenticacao(dependencias.autenticacaoServico));
    app.use("/usuarios", criarRotasUsuario(dependencias.usuarioServico, autenticar));
    app.use("/categorias", criarRotasCategoria(dependencias.categoriaServico, autenticar));
    app.use("/produtos", criarRotasProduto(dependencias.produtoServico, autenticar));
    app.use("/pedidos", criarRotasPedido(dependencias.pedidoServico, autenticar));
    app.use("/itens-pedido", criarRotasItemPedido(dependencias.itemPedidoServico, autenticar));
    app.use("/estatisticas", criarRotasEstatistica(dependencias.estatisticaServico, autenticar));

    // Rota que não existe: responde em JSON (e não com a página de erro padrão do Express)
    app.use((_req, res) => {
        res.status(404).json({ erro: "Rota não encontrada." });
    });

    app.use(tratadorErros); // sempre por último: pega os erros de todas as rotas acima

    return app;
}
