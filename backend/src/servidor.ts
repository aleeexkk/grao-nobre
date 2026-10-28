import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { UsuarioRepositorio } from "./repositorios/UsuarioRepositorio";
import { UsuarioServico } from "./servicos/UsuarioServico";
import { criarRotasUsuario } from "./rotas/usuarioRotas";

dotenv.config(); // lê o .env

const app = express();

app.use(cors()); // deixa o front-end (outra porta) chamar a API
app.use(express.json()); // faz o servidor entender JSON no corpo das requisições

// Monta as peças: repositório -> serviço -> rotas
const repositorio = new UsuarioRepositorio();
const servico = new UsuarioServico(repositorio);
app.use("/usuarios", criarRotasUsuario(servico));

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});