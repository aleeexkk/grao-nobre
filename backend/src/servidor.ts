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
import { criarApp, ORIGENS_PADRAO } from "./app";
import { pool } from "./config/conexao";

dotenv.config(); // lê o .env

// A chave secreta do token é obrigatória: sem ela o servidor nem liga (melhor do que ficar inseguro)
const segredo = process.env.JWT_SECRET ?? "";
if (segredo.length < 16) {
    console.error("Defina JWT_SECRET no arquivo .env (pelo menos 16 caracteres).");
    console.error('Para gerar uma: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

// Sem os dados do banco o servidor também nem liga (e avisa o que está faltando, em vez de dar erro estranho depois).
// DB_PASSWORD pode ser vazia (é o caso do MySQL do XAMPP), mas a variável precisa existir.
const faltando = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter((nome) => process.env[nome] === undefined);
if (faltando.length > 0) {
    console.error(`Faltam variáveis no arquivo .env: ${faltando.join(", ")}.`);
    process.exit(1);
}
if (!Number.isInteger(Number(process.env.DB_PORT))) {
    console.error("DB_PORT precisa ser um número (ex: 3306).");
    process.exit(1);
}

const DURACAO_DO_TOKEN = 2 * 60 * 60; // 2 horas, em segundos

// Sites que podem chamar a API pelo navegador. Opcional: CORS_ORIGIN="https://meusite.com,http://localhost:5173"
const origensDoEnv = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origem) => origem.trim())
    .filter((origem) => origem !== "");
const origensPermitidas = origensDoEnv.length > 0 ? origensDoEnv : ORIGENS_PADRAO;

// Monta as peças: repositórios (falam com o MySQL) -> serviços (regras) -> app (rotas)
const usuarios = new UsuarioRepositorio();
const categorias = new CategoriaRepositorio(); // a mesma peça serve a categoria e o produto (que confere se ela existe)
const produtos = new ProdutoRepositorio(); // idem: serve o produto e o item do pedido
const pedidos = new PedidoRepositorio(); // idem: serve o pedido e o item (que só entra em pedido aberto)
const tokenServico = new TokenServico(segredo, DURACAO_DO_TOKEN);
const app = criarApp(
    {
        usuarioServico: new UsuarioServico(usuarios),
        categoriaServico: new CategoriaServico(categorias),
        produtoServico: new ProdutoServico(produtos, categorias),
        pedidoServico: new PedidoServico(pedidos),
        itemPedidoServico: new ItemPedidoServico(new ItemPedidoRepositorio(), pedidos, produtos),
        estatisticaServico: new EstatisticaServico(new EstatisticaRepositorio()),
        autenticacaoServico: new AutenticacaoServico(usuarios, tokenServico),
        tokenServico,
    },
    origensPermitidas
);

const porta = Number(process.env.PORT) || 3000;
const servidor = app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});

// Desligamento educado (Ctrl+C ou "docker compose down"): para de aceitar chamadas novas, fecha as conexões
// com o banco e só então sai. Se travar por mais de 10 segundos, sai na marra.
function encerrar(sinal: string): void {
    console.log(`${sinal} recebido: encerrando o servidor...`);
    setTimeout(() => process.exit(1), 10_000).unref();
    servidor.close(() => {
        void pool.end().finally(() => process.exit(0));
    });
}
process.on("SIGTERM", () => encerrar("SIGTERM"));
process.on("SIGINT", () => encerrar("SIGINT"));
