import { describe, test, mock } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { iniciar, SENHA } from "./ambiente";

// Testes de segurança da API (cabeçalhos, CORS, limites de tamanho e trava de tentativas de login)
describe("segurança da API", () => {
    test("toda resposta traz cabeçalhos de segurança e não entrega o 'x-powered-by'", async () => {
        const a = await iniciar();
        try {
            const r = await fetch(a.base + "/categorias"); // 401, mas os cabeçalhos vêm mesmo assim
            assert.equal(r.headers.get("x-content-type-options"), "nosniff");
            assert.equal(r.headers.get("cache-control"), "no-store");
            assert.equal(r.headers.get("x-frame-options"), "DENY");
            assert.equal(r.headers.get("x-powered-by"), null);
        } finally {
            a.fechar();
        }
    });

    test("CORS: o site do front pode chamar a API; um site desconhecido não recebe a permissão", async () => {
        const a = await iniciar();
        try {
            const permitido = await fetch(a.base + "/categorias", { headers: { Origin: "http://localhost:5173" } });
            assert.equal(permitido.headers.get("access-control-allow-origin"), "http://localhost:5173");

            const desconhecido = await fetch(a.base + "/categorias", { headers: { Origin: "https://site-malicioso.com" } });
            assert.equal(desconhecido.headers.get("access-control-allow-origin"), null);
        } finally {
            a.fechar();
        }
    });

    test("corpo maior que 10 KB devolve 413 (e não erro 500)", async () => {
        const a = await iniciar();
        try {
            const r = await a.chamar("POST", "/usuarios", { nome: "a".repeat(20_000) });
            assert.equal(r.status, 413);
        } finally {
            a.fechar();
        }
    });

    test("cadastro com nome, e-mail ou senha grandes demais devolve 400 (e não erro 500 do banco)", async () => {
        const a = await iniciar();
        try {
            const base = { nome: "Bia Souza", email: "bia@email.com", senha: SENHA, cpf: "111.444.777-35" };
            assert.equal((await a.chamar("POST", "/usuarios", { ...base, nome: "a".repeat(101) })).status, 400);
            assert.equal((await a.chamar("POST", "/usuarios", { ...base, email: "a".repeat(146) + "@a.co" })).status, 400);
            assert.equal((await a.chamar("POST", "/usuarios", { ...base, senha: SENHA + "x".repeat(60) })).status, 400);
            assert.equal((await a.chamar("POST", "/usuarios", base)).status, 201); // e o cadastro normal segue funcionando
        } finally {
            a.fechar();
        }
    });
});

describe("login: trava contra tentativa de adivinhar a senha", () => {
    test("depois de 10 erros seguidos devolve 429, mesmo com a senha certa", async () => {
        const a = await iniciar();
        try {
            for (let i = 0; i < 10; i++) {
                const r = await a.chamar("POST", "/auth/login", { email: "ana@email.com", senha: "Errada@123" });
                assert.equal(r.status, 401);
            }
            const bloqueado = await a.chamar<{ erro: string }>("POST", "/auth/login", { email: "ana@email.com", senha: SENHA });
            assert.equal(bloqueado.status, 429);
            assert.match(bloqueado.corpo.erro, /Muitas tentativas/);

            // Outro e-mail não é afetado pela trava da Ana
            const outro = await a.chamar("POST", "/auth/login", { email: "outro@email.com", senha: "Errada@123" });
            assert.equal(outro.status, 401);
        } finally {
            a.fechar();
        }
    });

    test("login certo no meio do caminho zera a conta de erros", async () => {
        const a = await iniciar();
        try {
            for (let i = 0; i < 9; i++) {
                await a.chamar("POST", "/auth/login", { email: "ana@email.com", senha: "Errada@123" });
            }
            assert.equal((await a.chamar("POST", "/auth/login", { email: "ana@email.com", senha: SENHA })).status, 200);

            for (let i = 0; i < 9; i++) {
                const r = await a.chamar("POST", "/auth/login", { email: "ana@email.com", senha: "Errada@123" });
                assert.equal(r.status, 401); // 9 erros novos: ainda não chegou no limite
            }
        } finally {
            a.fechar();
        }
    });

    test("e-mail que não existe gasta o mesmo trabalho do bcrypt (o tempo não entrega quem tem conta)", async () => {
        const a = await iniciar();
        const espiao = mock.method(bcrypt, "compare");
        try {
            const r = await a.chamar("POST", "/auth/login", { email: "ninguem@email.com", senha: "Qualquer@123" });
            assert.equal(r.status, 401);
            assert.equal(espiao.mock.callCount(), 1); // comparou mesmo sem o usuário existir
        } finally {
            espiao.mock.restore();
            a.fechar();
        }
    });
});
