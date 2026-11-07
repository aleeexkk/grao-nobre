import dotenv from "dotenv";
import { UsuarioRepositorio } from "./repositorios/UsuarioRepositorio";
import { CategoriaRepositorio } from "./repositorios/CategoriaRepositorio";
import { ProdutoRepositorio } from "./repositorios/ProdutoRepositorio";
import { PedidoRepositorio } from "./repositorios/PedidoRepositorio";
import { ItemPedidoRepositorio } from "./repositorios/ItemPedidoRepositorio";
import { EstatisticaRepositorio } from "./repositorios/EstatisticaRepositorio";
import { UsuarioServico } from "./servicos/UsuarioServico";
import { CategoriaServico } from "./servicos/CategoriaServico";
import { ProdutoServico } from "./servicos/ProdutoServico";
import { PedidoServico } from "./servicos/PedidoServico";
import { ItemPedidoServico } from "./servicos/ItemPedidoServico";
import { EstatisticaServico } from "./servicos/EstatisticaServico";
import { AutenticacaoServico } from "./servicos/AutenticacaoServico";
import { TokenServico } from "./servicos/TokenServico";
import { criarApp } from "./app";

dotenv.config(); // lê o .env

// A chave secreta do token é obrigatória: sem ela o servidor nem liga (melhor do que ficar inseguro)
const segredo = process.env.JWT_SECRET ?? "";
if (segredo.length < 16) {
    console.error("Defina JWT_SECRET no arquivo .env (pelo menos 16 caracteres).");
    console.error('Para gerar uma: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

const DURACAO_DO_TOKEN = 2 * 60 * 60; // 2 horas, em segundos

// Monta as peças: repositórios (falam com o MySQL) -> serviços (regras) -> app (rotas)
const usuarios = new UsuarioRepositorio();
const categorias = new CategoriaRepositorio(); // a mesma peça serve a categoria e o produto (que confere se ela existe)
const produtos = new ProdutoRepositorio(); // idem: serve o produto e o item do pedido
const pedidos = new PedidoRepositorio(); // idem: serve o pedido e o item (que só entra em pedido aberto)
const tokenServico = new TokenServico(segredo, DURACAO_DO_TOKEN);
const app = criarApp({
    usuarioServico: new UsuarioServico(usuarios),
    categoriaServico: new CategoriaServico(categorias),
    produtoServico: new ProdutoServico(produtos, categorias),
    pedidoServico: new PedidoServico(pedidos),
    itemPedidoServico: new ItemPedidoServico(new ItemPedidoRepositorio(), pedidos, produtos),
    estatisticaServico: new EstatisticaServico(new EstatisticaRepositorio()),
    autenticacaoServico: new AutenticacaoServico(usuarios, tokenServico),
    tokenServico,
});

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
