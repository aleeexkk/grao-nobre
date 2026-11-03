import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { criarApp } from "../app";
import { UsuarioServico } from "../servicos/UsuarioServico";
import { AutenticacaoServico } from "../servicos/AutenticacaoServico";
import { TokenServico } from "../servicos/TokenServico";
import { UsuarioRepositorioMemoria } from "./UsuarioRepositorioMemoria";

// Dois CPFs válidos de exemplo e uma senha forte
const CPF_A = "529.982.247-25";
const CPF_B = "111.444.777-35";
const SENHA = "Cafe@2026x";
const SEGREDO = "segredo-de-teste-com-mais-de-16-caracteres";

interface Resposta {
    status: number;
    corpo: Record<string, unknown>;
}

describe("API de usuários (cadastro, login e edição)", () => {
    const repositorio = new UsuarioRepositorioMemoria();
    const tokens = new TokenServico(SEGREDO, 60);
    let servidor: Server;
    let base = "";

    // Faz uma chamada HTTP de verdade contra o app que está rodando no teste
    async function chamar(metodo: string, caminho: string, corpo?: unknown, token?: string): Promise<Resposta> {
        const resposta = await fetch(base + caminho, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: corpo === undefined ? undefined : JSON.stringify(corpo),
        });
        return { status: resposta.status, corpo: (await resposta.json()) as Record<string, unknown> };
    }

    // Cadastra e já faz login: devolve id e token
    async function cadastrarELogar(nome: string, email: string, cpf: string): Promise<{ id: number; token: string }> {
        const cadastro = await chamar("POST", "/usuarios", { nome, email, senha: SENHA, cpf });
        assert.equal(cadastro.status, 201);
        const login = await chamar("POST", "/auth/login", { email, senha: SENHA });
        assert.equal(login.status, 200);
        return { id: cadastro.corpo.id as number, token: login.corpo.token as string };
    }

    before(async () => {
        const app = criarApp({
            usuarioServico: new UsuarioServico(repositorio),
            autenticacaoServico: new AutenticacaoServico(repositorio, tokens),
            tokenServico: tokens,
        });
        servidor = app.listen(0); // porta 0 = o sistema escolhe uma livre
        await new Promise<void>((pronto) => servidor.once("listening", () => pronto()));
        base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
    });

    after(() => {
        servidor.close();
    });

    test("cadastro válido devolve 201 e NÃO devolve a senha; a senha fica em hash", async () => {
        const r = await chamar("POST", "/usuarios", { nome: "Ana Lima", email: "ana@email.com", senha: SENHA, cpf: CPF_A });
        assert.equal(r.status, 201);
        assert.equal(r.corpo.email, "ana@email.com");
        assert.equal("senha" in r.corpo, false);

        const guardado = repositorio.todos().find((x) => x.email === "ana@email.com");
        assert.ok(guardado);
        assert.notEqual(guardado.senhaHash, SENHA);
        assert.match(guardado.senhaHash, /^\$2[aby]\$/); // formato do bcrypt
    });

    test("cadastro repetido (e-mail ou CPF) devolve 409", async () => {
        const r = await chamar("POST", "/usuarios", { nome: "Outra Ana", email: "ana@email.com", senha: SENHA, cpf: CPF_B });
        assert.equal(r.status, 409);
    });

    test("cadastro com campo faltando devolve 400", async () => {
        const r = await chamar("POST", "/usuarios", { nome: "Sem Cpf", email: "x@email.com", senha: SENHA });
        assert.equal(r.status, 400);
    });

    test("JSON quebrado devolve 400 (e não erro 500)", async () => {
        const resposta = await fetch(base + "/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{ isso nao e json",
        });
        assert.equal(resposta.status, 400);
    });

    test("rota que não existe devolve 404 em JSON", async () => {
        const r = await chamar("GET", "/nada-aqui");
        assert.equal(r.status, 404);
    });

    describe("login", () => {
        test("e-mail e senha corretos devolvem 200 com token e usuário (sem senha)", async () => {
            const r = await chamar("POST", "/auth/login", { email: "ANA@email.com ", senha: SENHA });
            assert.equal(r.status, 200);
            assert.equal(typeof r.corpo.token, "string");
            const usuario = r.corpo.usuario as Record<string, unknown>;
            assert.equal(usuario.email, "ana@email.com");
            assert.equal("senha" in usuario, false);
            assert.equal("senhaHash" in usuario, false);
        });

        test("senha errada devolve 401", async () => {
            const r = await chamar("POST", "/auth/login", { email: "ana@email.com", senha: "Errada@123" });
            assert.equal(r.status, 401);
        });

        test("e-mail que não existe devolve 401 com a MESMA mensagem da senha errada", async () => {
            const inexistente = await chamar("POST", "/auth/login", { email: "ninguem@email.com", senha: SENHA });
            const senhaErrada = await chamar("POST", "/auth/login", { email: "ana@email.com", senha: "Errada@123" });
            assert.equal(inexistente.status, 401);
            assert.equal(inexistente.corpo.erro, senhaErrada.corpo.erro);
        });

        test("e-mail com formato inválido devolve 400", async () => {
            const r = await chamar("POST", "/auth/login", { email: "isso-nao-e-email", senha: SENHA });
            assert.equal(r.status, 400);
        });

        test("corpo sem senha devolve 400", async () => {
            const r = await chamar("POST", "/auth/login", { email: "ana@email.com" });
            assert.equal(r.status, 400);
        });
    });

    describe("rotas protegidas", () => {
        test("sem token devolve 401", async () => {
            assert.equal((await chamar("GET", "/usuarios/me")).status, 401);
        });

        test("token falso devolve 401", async () => {
            assert.equal((await chamar("GET", "/usuarios/me", undefined, "token.falso.aqui")).status, 401);
        });

        test("token assinado com outra chave devolve 401", async () => {
            const falso = new TokenServico("outra-chave-completamente-diferente", 60).gerar({ id: 1, email: "ana@email.com" });
            assert.equal((await chamar("GET", "/usuarios/me", undefined, falso)).status, 401);
        });

        test("token vencido devolve 401", async () => {
            const vencido = new TokenServico(SEGREDO, -10).gerar({ id: 1, email: "ana@email.com" });
            assert.equal((await chamar("GET", "/usuarios/me", undefined, vencido)).status, 401);
        });

        test("token válido devolve o perfil de quem está logado", async () => {
            const { token } = await cadastrarELogar("Bia Souza", "bia@email.com", CPF_B);
            const r = await chamar("GET", "/usuarios/me", undefined, token);
            assert.equal(r.status, 200);
            assert.equal(r.corpo.email, "bia@email.com");
            assert.equal(r.corpo.cpf, "11144477735");
            assert.equal("senha" in r.corpo, false);
        });
    });

    describe("edição de usuário", () => {
        const NOVA_SENHA = "Nova@Senha9";
        let ana: { id: number; token: string };
        let bia: { id: number; token: string };

        before(async () => {
            const loginAna = await chamar("POST", "/auth/login", { email: "ana@email.com", senha: SENHA });
            const perfilAna = await chamar("GET", "/usuarios/me", undefined, loginAna.corpo.token as string);
            ana = { id: perfilAna.corpo.id as number, token: loginAna.corpo.token as string };
            const loginBia = await chamar("POST", "/auth/login", { email: "bia@email.com", senha: SENHA });
            const perfilBia = await chamar("GET", "/usuarios/me", undefined, loginBia.corpo.token as string);
            bia = { id: perfilBia.corpo.id as number, token: loginBia.corpo.token as string };
        });

        test("sem token devolve 401", async () => {
            const r = await chamar("PUT", `/usuarios/${ana.id}`, { nome: "Ana", cpf: CPF_A, senha: NOVA_SENHA });
            assert.equal(r.status, 401);
        });

        test("tentar editar OUTRO usuário devolve 403", async () => {
            const r = await chamar("PUT", `/usuarios/${bia.id}`, { nome: "Hackeada", cpf: CPF_B, senha: NOVA_SENHA }, ana.token);
            assert.equal(r.status, 403);
        });

        test("campo faltando devolve 400", async () => {
            const r = await chamar("PUT", `/usuarios/${ana.id}`, { nome: "Ana", cpf: CPF_A }, ana.token);
            assert.equal(r.status, 400);
        });

        test("tentar trocar o e-mail devolve 400 e o e-mail não muda", async () => {
            const r = await chamar("PUT", `/usuarios/${ana.id}`, { nome: "Ana", cpf: CPF_A, senha: NOVA_SENHA, email: "novo@email.com" }, ana.token);
            assert.equal(r.status, 400);
            const perfil = await chamar("GET", "/usuarios/me", undefined, ana.token);
            assert.equal(perfil.corpo.email, "ana@email.com");
        });

        test("CPF inválido devolve 400", async () => {
            const r = await chamar("PUT", `/usuarios/${ana.id}`, { nome: "Ana", cpf: "123.456.789-00", senha: NOVA_SENHA }, ana.token);
            assert.equal(r.status, 400);
        });

        test("senha fraca devolve 400", async () => {
            const r = await chamar("PUT", `/usuarios/${ana.id}`, { nome: "Ana", cpf: CPF_A, senha: "fraca" }, ana.token);
            assert.equal(r.status, 400);
        });

        test("CPF que já é de outra pessoa devolve 409", async () => {
            const r = await chamar("PUT", `/usuarios/${ana.id}`, { nome: "Ana", cpf: CPF_B, senha: NOVA_SENHA }, ana.token);
            assert.equal(r.status, 409);
        });

        test("id inválido na URL devolve 400", async () => {
            const r = await chamar("PUT", "/usuarios/abc", { nome: "Ana", cpf: CPF_A, senha: NOVA_SENHA }, ana.token);
            assert.equal(r.status, 400);
        });

        test("edição correta devolve 200; e-mail igual no corpo é aceito; a senha nova passa a valer", async () => {
            const r = await chamar(
                "PUT",
                `/usuarios/${ana.id}`,
                { nome: "  Ana Lima Souza ", cpf: CPF_A, senha: NOVA_SENHA, email: "ANA@email.com" },
                ana.token
            );
            assert.equal(r.status, 200);
            assert.equal(r.corpo.nome, "Ana Lima Souza");
            assert.equal(r.corpo.email, "ana@email.com");
            assert.equal("senha" in r.corpo, false);

            // Senha antiga não funciona mais; a nova funciona
            assert.equal((await chamar("POST", "/auth/login", { email: "ana@email.com", senha: SENHA })).status, 401);
            assert.equal((await chamar("POST", "/auth/login", { email: "ana@email.com", senha: NOVA_SENHA })).status, 200);
        });
    });
});
