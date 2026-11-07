import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { criarApp } from "../app";
import { TokenServico } from "../servicos/TokenServico";
import { UsuarioRepositorioMemoria } from "./UsuarioRepositorioMemoria";
import { criarDependenciasDeTeste } from "./dependenciasDeTeste";

const SENHA = "Cafe@2026x";
const SEGREDO = "segredo-de-teste-com-mais-de-16-caracteres";

// Como a categoria e a página chegam no JSON da API
interface CategoriaJson {
    id: number;
    nome: string;
    descricao: string | null;
}
interface PaginaJson {
    itens: CategoriaJson[];
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}
interface Resposta<T> {
    status: number;
    corpo: T;
}

// Sobe um app NOVO (com repositórios de mentira vazios), cadastra um usuário, faz login
// e devolve as ferramentas do teste. Cada grupo de testes chama isso e começa do zero.
async function iniciar() {
    const tokens = new TokenServico(SEGREDO, 60);
    const usuarios = new UsuarioRepositorioMemoria();
    const app = criarApp(criarDependenciasDeTeste(usuarios, tokens));
    const servidor = app.listen(0); // porta 0 = o sistema escolhe uma livre
    await new Promise<void>((pronto) => servidor.once("listening", () => pronto()));
    const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;

    // Chamada HTTP de verdade contra o app. Aceita resposta sem corpo (o 204 não devolve nada)
    async function chamar<T = Record<string, unknown>>(
        metodo: string,
        caminho: string,
        corpo?: unknown,
        token?: string
    ): Promise<Resposta<T>> {
        const resposta = await fetch(base + caminho, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: corpo === undefined ? undefined : JSON.stringify(corpo),
        });
        const texto = await resposta.text();
        return { status: resposta.status, corpo: (texto ? JSON.parse(texto) : null) as T };
    }

    // Cadastra um usuário e faz login pra ter o token (o "crachá")
    await chamar("POST", "/usuarios", { nome: "Ana Lima", email: "ana@email.com", senha: SENHA, cpf: "529.982.247-25" });
    const login = await chamar<{ token: string }>("POST", "/auth/login", { email: "ana@email.com", senha: SENHA });
    const token = login.corpo.token;

    return {
        chamar,
        // Atalho: chamada já com o token de quem está logado
        logado: <T = Record<string, unknown>>(metodo: string, caminho: string, corpo?: unknown) =>
            chamar<T>(metodo, caminho, corpo, token),
        // Atalho: cria uma categoria e devolve ela
        criar: async (nome: string, descricao?: string) =>
            (await chamar<CategoriaJson>("POST", "/categorias", { nome, descricao }, token)).corpo,
        fechar: () => servidor.close(),
    };
}
type Ambiente = Awaited<ReturnType<typeof iniciar>>;

describe("API de categorias", () => {
    let amb: Ambiente;

    before(async () => {
        amb = await iniciar();
    });
    after(() => amb.fechar());

    describe("proteção por login", () => {
        const rotas = [
            ["GET", "/categorias"],
            ["POST", "/categorias"],
            ["GET", "/categorias/1"],
            ["PUT", "/categorias/1"],
            ["DELETE", "/categorias/1"],
        ];
        for (const [metodo, caminho] of rotas) {
            test(`${metodo} ${caminho} sem token devolve 401`, async () => {
                // O GET e o DELETE não podem levar corpo; só o POST e o PUT mandam dados
                const corpo = metodo === "POST" || metodo === "PUT" ? { nome: "Qualquer" } : undefined;
                const r = await amb.chamar(metodo!, caminho!, corpo);
                assert.equal(r.status, 401);
            });
        }

        test("token falso devolve 401", async () => {
            const r = await amb.chamar("GET", "/categorias", undefined, "token.falso.aqui");
            assert.equal(r.status, 401);
        });
    });

    describe("criar (POST /categorias)", () => {
        test("cria, devolve 201 com id e tira os espaços das pontas", async () => {
            const r = await amb.logado<CategoriaJson>("POST", "/categorias", { nome: "  Cafés  ", descricao: "Bebidas quentes" });
            assert.equal(r.status, 201);
            assert.equal(typeof r.corpo.id, "number");
            assert.equal(r.corpo.nome, "Cafés");
            assert.equal(r.corpo.descricao, "Bebidas quentes");
        });

        test("a descrição é opcional (vira null)", async () => {
            const r = await amb.logado<CategoriaJson>("POST", "/categorias", { nome: "Pães" });
            assert.equal(r.status, 201);
            assert.equal(r.corpo.descricao, null);
        });

        test("nome repetido devolve 409, mesmo trocando maiúscula e minúscula", async () => {
            await amb.criar("Salgados");
            const r = await amb.logado("POST", "/categorias", { nome: "SALGADOS" });
            assert.equal(r.status, 409);
        });

        // Cada caso inválido vira um teste próprio
        const invalidos: Array<[string, unknown]> = [
            ["sem nome", {}],
            ["nome que não é texto", { nome: 5 }],
            ["nome curto demais", { nome: "A" }],
            ["nome longo demais (61 letras)", { nome: "x".repeat(61) }],
            ["descrição que não é texto", { nome: "Ok Teste", descricao: 7 }],
            ["descrição longa demais (201 letras)", { nome: "Ok Teste", descricao: "d".repeat(201) }],
        ];
        for (const [descricao, corpo] of invalidos) {
            test(`${descricao} devolve 400`, async () => {
                const r = await amb.logado("POST", "/categorias", corpo);
                assert.equal(r.status, 400);
            });
        }

        test("sem corpo nenhum devolve 400", async () => {
            const r = await amb.logado("POST", "/categorias");
            assert.equal(r.status, 400);
        });
    });

    describe("buscar (GET /categorias/:id)", () => {
        test("devolve a categoria", async () => {
            const criada = await amb.criar("Bolos");
            const r = await amb.logado<CategoriaJson>("GET", `/categorias/${criada.id}`);
            assert.equal(r.status, 200);
            assert.deepEqual(r.corpo, criada);
        });

        test("id que não existe devolve 404", async () => {
            const r = await amb.logado<{ erro: string }>("GET", "/categorias/99999");
            assert.equal(r.status, 404);
            assert.equal(r.corpo.erro, "Categoria não encontrada.");
        });

        for (const id of ["abc", "0", "-1", "1.5"]) {
            test(`id inválido "${id}" devolve 400`, async () => {
                const r = await amb.logado("GET", `/categorias/${id}`);
                assert.equal(r.status, 400);
            });
        }
    });

    describe("editar (PUT /categorias/:id)", () => {
        test("altera e devolve a categoria atualizada", async () => {
            const criada = await amb.criar("Sucos");
            const r = await amb.logado<CategoriaJson>("PUT", `/categorias/${criada.id}`, { nome: "Sucos Naturais", descricao: "Sem açúcar" });
            assert.equal(r.status, 200);
            assert.deepEqual(r.corpo, { id: criada.id, nome: "Sucos Naturais", descricao: "Sem açúcar" });

            // E a mudança ficou mesmo guardada
            const lida = await amb.logado<CategoriaJson>("GET", `/categorias/${criada.id}`);
            assert.equal(lida.corpo.nome, "Sucos Naturais");
        });

        test("pode salvar mantendo o próprio nome (não é conflito com ela mesma)", async () => {
            const criada = await amb.criar("Tortas");
            const r = await amb.logado("PUT", `/categorias/${criada.id}`, { nome: "Tortas", descricao: "Nova descrição" });
            assert.equal(r.status, 200);
        });

        test("id que não existe devolve 404", async () => {
            const r = await amb.logado("PUT", "/categorias/99999", { nome: "Fantasma" });
            assert.equal(r.status, 404);
        });

        test("nome que já é de OUTRA categoria devolve 409", async () => {
            await amb.criar("Chás");
            const outra = await amb.criar("Infusões");
            const r = await amb.logado("PUT", `/categorias/${outra.id}`, { nome: "Chás" });
            assert.equal(r.status, 409);
        });

        test("dados inválidos devolvem 400", async () => {
            const criada = await amb.criar("Lanches");
            const r = await amb.logado("PUT", `/categorias/${criada.id}`, { nome: "A" });
            assert.equal(r.status, 400);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("PUT", "/categorias/abc", { nome: "Qualquer" });
            assert.equal(r.status, 400);
        });
    });

    describe("excluir (DELETE /categorias/:id)", () => {
        test("apaga (204) e depois ela não existe mais", async () => {
            const criada = await amb.criar("Temporária");
            const r = await amb.logado("DELETE", `/categorias/${criada.id}`);
            assert.equal(r.status, 204);
            assert.equal((await amb.logado("GET", `/categorias/${criada.id}`)).status, 404);
        });

        test("apagar de novo (ou id que não existe) devolve 404", async () => {
            const criada = await amb.criar("Apaga Duas Vezes");
            await amb.logado("DELETE", `/categorias/${criada.id}`);
            assert.equal((await amb.logado("DELETE", `/categorias/${criada.id}`)).status, 404);
            assert.equal((await amb.logado("DELETE", "/categorias/99999")).status, 404);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("DELETE", "/categorias/abc");
            assert.equal(r.status, 400);
        });
    });
});

describe("API de categorias: listagem com paginação", () => {
    let amb: Ambiente;

    // Começa do zero e cria exatamente 5 categorias, pra os números baterem
    before(async () => {
        amb = await iniciar();
        for (const nome of ["Cafés", "Pães", "Doces", "Salgados", "Sucos"]) {
            await amb.criar(nome);
        }
    });
    after(() => amb.fechar());

    test("sem parâmetros: página 1, limite 10 e as 5 categorias", async () => {
        const r = await amb.logado<PaginaJson>("GET", "/categorias");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.pagina, 1);
        assert.equal(r.corpo.limite, 10);
        assert.equal(r.corpo.itens.length, 5);
        assert.equal(r.corpo.total, 5);
        assert.equal(r.corpo.totalPaginas, 1);
    });

    test("limite 2: página 1 tem 2 itens e são 3 páginas no total", async () => {
        const r = await amb.logado<PaginaJson>("GET", "/categorias?pagina=1&limite=2");
        assert.equal(r.corpo.itens.length, 2);
        assert.equal(r.corpo.total, 5);
        assert.equal(r.corpo.totalPaginas, 3);
        assert.deepEqual(r.corpo.itens.map((c) => c.nome), ["Cafés", "Pães"]); // na ordem de criação
    });

    test("a última página traz só o que sobrou", async () => {
        const r = await amb.logado<PaginaJson>("GET", "/categorias?pagina=3&limite=2");
        assert.deepEqual(r.corpo.itens.map((c) => c.nome), ["Sucos"]);
    });

    test("página depois do fim devolve lista vazia (e não erro)", async () => {
        const r = await amb.logado<PaginaJson>("GET", "/categorias?pagina=99&limite=2");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.itens.length, 0);
    });

    const invalidos = ["pagina=0", "pagina=-1", "pagina=abc", "limite=0", "limite=51", "limite=1.5", "pagina=1&pagina=2"];
    for (const consulta of invalidos) {
        test(`paginação inválida (?${consulta}) devolve 400`, async () => {
            const r = await amb.logado("GET", `/categorias?${consulta}`);
            assert.equal(r.status, 400);
        });
    }
});
