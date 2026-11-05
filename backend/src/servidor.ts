import dotenv from "dotenv";
import { UsuarioRepositorio } from "./repositorios/UsuarioRepositorio";
import { CategoriaRepositorio } from "./repositorios/CategoriaRepositorio";
import { UsuarioServico } from "./servicos/UsuarioServico";
import { CategoriaServico } from "./servicos/CategoriaServico";
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

// Monta as peças: repositório -> serviços -> app
const repositorio = new UsuarioRepositorio();
const tokenServico = new TokenServico(segredo, DURACAO_DO_TOKEN);
const app = criarApp({
    usuarioServico: new UsuarioServico(repositorio),
    categoriaServico: new CategoriaServico(new CategoriaRepositorio()),
    autenticacaoServico: new AutenticacaoServico(repositorio, tokenServico),
    tokenServico,
});

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});