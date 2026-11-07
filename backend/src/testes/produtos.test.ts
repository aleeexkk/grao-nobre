import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { iniciar } from "./ambiente";
import type { Ambiente, PaginaJson, ProdutoJson } from "./ambiente";

describe("API de produtos", () => {
    let amb: Ambiente;
    let idCategoria: number; // uma categoria pronta pra usar nos testes

    before(async () => {
        amb = await iniciar();
        idCategoria = (await amb.criarCategoria("Cafés")).id;
    });
    after(() => amb.fechar());

    // Atalho: cria um produto válido
    const novo = (nome: string, preco = 6.5) => amb.criarProduto(nome, preco, idCategoria);

    describe("proteção por login", () => {
        const rotas = [
            ["GET", "/produtos"],
            ["POST", "/produtos"],
            ["GET", "/produtos/1"],
            ["PUT", "/produtos/1"],
            ["DELETE", "/produtos/1"],
        ];
        for (const [metodo, caminho] of rotas) {
            test(`${metodo} ${caminho} sem token devolve 401`, async () => {
                const corpo = metodo === "POST" || metodo === "PUT" ? { nome: "Qualquer", preco: 5, idCategoria: 1 } : undefined;
                const r = await amb.chamar(metodo!, caminho!, corpo);
                assert.equal(r.status, 401);
            });
        }

        test("token falso devolve 401", async () => {
            const r = await amb.chamar("GET", "/produtos", undefined, "token.falso.aqui");
            assert.equal(r.status, 401);
        });
    });

    describe("criar (POST /produtos)", () => {
        test("cria, devolve 201 com id, preço numérico e o nome da categoria", async () => {
            const r = await amb.logado<ProdutoJson>("POST", "/produtos", {
                nome: "  Café Expresso  ",
                descricao: "Curto e forte",
                preco: 6.5,
                idCategoria,
            });
            assert.equal(r.status, 201);
            assert.equal(typeof r.corpo.id, "number");
            assert.equal(r.corpo.nome, "Café Expresso"); // sem os espaços das pontas
            assert.equal(r.corpo.descricao, "Curto e forte");
            assert.equal(r.corpo.preco, 6.5);
            assert.equal(typeof r.corpo.preco, "number");
            assert.equal(r.corpo.idCategoria, idCategoria);
            assert.equal(r.corpo.categoria, "Cafés"); // veio do JOIN
        });

        test("a descrição é opcional (vira null)", async () => {
            const r = await amb.logado<ProdutoJson>("POST", "/produtos", { nome: "Pão Francês", preco: 1.2, idCategoria });
            assert.equal(r.status, 201);
            assert.equal(r.corpo.descricao, null);
        });

        test("preço com centavos quebrados (10,10) é guardado certinho", async () => {
            const r = await amb.logado<ProdutoJson>("POST", "/produtos", { nome: "Suco de Laranja", preco: 10.1, idCategoria });
            assert.equal(r.corpo.preco, 10.1);
        });

        test("nome repetido devolve 409, mesmo trocando maiúscula e minúscula", async () => {
            await novo("Cappuccino");
            const r = await amb.logado("POST", "/produtos", { nome: "CAPPUCCINO", preco: 9, idCategoria });
            assert.equal(r.status, 409);
        });

        test("categoria que não existe devolve 400 com mensagem clara", async () => {
            const r = await amb.logado<{ erro: string }>("POST", "/produtos", { nome: "Sem Categoria", preco: 5, idCategoria: 99999 });
            assert.equal(r.status, 400);
            assert.equal(r.corpo.erro, "A categoria informada não existe.");
        });

        // Cada caso inválido vira um teste próprio
        const invalidos: Array<[string, unknown]> = [
            ["sem nome", { preco: 5, idCategoria: 1 }],
            ["nome que não é texto", { nome: 5, preco: 5, idCategoria: 1 }],
            ["nome curto demais", { nome: "A", preco: 5, idCategoria: 1 }],
            ["nome longo demais (101 letras)", { nome: "x".repeat(101), preco: 5, idCategoria: 1 }],
            ["descrição que não é texto", { nome: "Ok Teste", descricao: 7, preco: 5, idCategoria: 1 }],
            ["descrição longa demais (256 letras)", { nome: "Ok Teste", descricao: "d".repeat(256), preco: 5, idCategoria: 1 }],
            ["sem preço", { nome: "Ok Teste", idCategoria: 1 }],
            ["preço em texto (\"12.5\")", { nome: "Ok Teste", preco: "12.5", idCategoria: 1 }],
            ["preço zero", { nome: "Ok Teste", preco: 0, idCategoria: 1 }],
            ["preço negativo", { nome: "Ok Teste", preco: -3, idCategoria: 1 }],
            ["preço com 3 casas decimais", { nome: "Ok Teste", preco: 1.234, idCategoria: 1 }],
            ["preço acima de 99999,99", { nome: "Ok Teste", preco: 100000, idCategoria: 1 }],
            ["sem categoria", { nome: "Ok Teste", preco: 5 }],
            ["categoria em texto", { nome: "Ok Teste", preco: 5, idCategoria: "1" }],
            ["categoria zero", { nome: "Ok Teste", preco: 5, idCategoria: 0 }],
            ["categoria com decimal", { nome: "Ok Teste", preco: 5, idCategoria: 1.5 }],
        ];
        for (const [descricao, corpo] of invalidos) {
            test(`${descricao} devolve 400`, async () => {
                const r = await amb.logado("POST", "/produtos", corpo);
                assert.equal(r.status, 400);
            });
        }

        test("sem corpo nenhum devolve 400", async () => {
            const r = await amb.logado("POST", "/produtos");
            assert.equal(r.status, 400);
        });
    });

    describe("buscar (GET /produtos/:id)", () => {
        test("devolve o produto", async () => {
            const criado = await novo("Bolo de Cenoura", 10);
            const r = await amb.logado<ProdutoJson>("GET", `/produtos/${criado.id}`);
            assert.equal(r.status, 200);
            assert.deepEqual(r.corpo, criado);
        });

        test("id que não existe devolve 404", async () => {
            const r = await amb.logado<{ erro: string }>("GET", "/produtos/99999");
            assert.equal(r.status, 404);
            assert.equal(r.corpo.erro, "Produto não encontrado.");
        });

        for (const id of ["abc", "0", "-1", "1.5"]) {
            test(`id inválido "${id}" devolve 400`, async () => {
                const r = await amb.logado("GET", `/produtos/${id}`);
                assert.equal(r.status, 400);
            });
        }
    });

    describe("editar (PUT /produtos/:id)", () => {
        test("altera e devolve o produto atualizado (e a mudança fica guardada)", async () => {
            const criado = await novo("Coxinha", 7);
            const outra = await amb.criarCategoria("Salgados");
            const r = await amb.logado<ProdutoJson>("PUT", `/produtos/${criado.id}`, {
                nome: "Coxinha de Frango",
                descricao: "Com catupiry",
                preco: 8.5,
                idCategoria: outra.id,
            });
            assert.equal(r.status, 200);
            assert.deepEqual(r.corpo, {
                id: criado.id,
                nome: "Coxinha de Frango",
                descricao: "Com catupiry",
                preco: 8.5,
                idCategoria: outra.id,
                categoria: "Salgados",
            });

            const lido = await amb.logado<ProdutoJson>("GET", `/produtos/${criado.id}`);
            assert.equal(lido.corpo.nome, "Coxinha de Frango");
        });

        test("pode salvar mantendo o próprio nome (não é conflito com ele mesmo)", async () => {
            const criado = await novo("Torta de Limão", 12);
            const r = await amb.logado("PUT", `/produtos/${criado.id}`, { nome: "Torta de Limão", preco: 13, idCategoria });
            assert.equal(r.status, 200);
        });

        test("id que não existe devolve 404", async () => {
            const r = await amb.logado("PUT", "/produtos/99999", { nome: "Fantasma", preco: 5, idCategoria });
            assert.equal(r.status, 404);
        });

        test("nome que já é de OUTRO produto devolve 409", async () => {
            await novo("Chá Mate");
            const outro = await novo("Chá Verde");
            const r = await amb.logado("PUT", `/produtos/${outro.id}`, { nome: "Chá Mate", preco: 5, idCategoria });
            assert.equal(r.status, 409);
        });

        test("dados inválidos devolvem 400", async () => {
            const criado = await novo("Misto Quente", 9);
            const r = await amb.logado("PUT", `/produtos/${criado.id}`, { nome: "Misto Quente", preco: -1, idCategoria });
            assert.equal(r.status, 400);
        });

        test("categoria que não existe devolve 400", async () => {
            const criado = await novo("Brigadeiro", 4);
            const r = await amb.logado("PUT", `/produtos/${criado.id}`, { nome: "Brigadeiro", preco: 4, idCategoria: 99999 });
            assert.equal(r.status, 400);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("PUT", "/produtos/abc", { nome: "Qualquer", preco: 5, idCategoria });
            assert.equal(r.status, 400);
        });
    });

    describe("excluir (DELETE /produtos/:id)", () => {
        test("apaga (204) e depois ele não existe mais", async () => {
            const criado = await novo("Temporário");
            const r = await amb.logado("DELETE", `/produtos/${criado.id}`);
            assert.equal(r.status, 204);
            assert.equal((await amb.logado("GET", `/produtos/${criado.id}`)).status, 404);
        });

        test("apagar de novo (ou id que não existe) devolve 404", async () => {
            const criado = await novo("Apaga Duas Vezes");
            await amb.logado("DELETE", `/produtos/${criado.id}`);
            assert.equal((await amb.logado("DELETE", `/produtos/${criado.id}`)).status, 404);
            assert.equal((await amb.logado("DELETE", "/produtos/99999")).status, 404);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("DELETE", "/produtos/abc");
            assert.equal(r.status, 400);
        });
    });
});

describe("API de produtos: listagem com paginação", () => {
    let amb: Ambiente;

    // Começa do zero e cria exatamente 5 produtos (2 categorias), pra os números baterem
    before(async () => {
        amb = await iniciar();
        const bebidas = await amb.criarCategoria("Bebidas");
        const doces = await amb.criarCategoria("Doces");
        await amb.criarProduto("Café", 5, bebidas.id);
        await amb.criarProduto("Suco", 8, bebidas.id);
        await amb.criarProduto("Bolo", 10, doces.id);
        await amb.criarProduto("Brigadeiro", 4, doces.id);
        await amb.criarProduto("Torta", 12, doces.id);
    });
    after(() => amb.fechar());

    test("sem parâmetros: página 1, limite 10 e os 5 produtos (cada um com o nome da categoria)", async () => {
        const r = await amb.logado<PaginaJson<ProdutoJson>>("GET", "/produtos");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.pagina, 1);
        assert.equal(r.corpo.limite, 10);
        assert.equal(r.corpo.itens.length, 5);
        assert.equal(r.corpo.total, 5);
        assert.equal(r.corpo.totalPaginas, 1);
        assert.deepEqual(r.corpo.itens.map((p) => p.categoria), ["Bebidas", "Bebidas", "Doces", "Doces", "Doces"]);
    });

    test("limite 2: página 1 tem 2 itens e são 3 páginas no total", async () => {
        const r = await amb.logado<PaginaJson<ProdutoJson>>("GET", "/produtos?pagina=1&limite=2");
        assert.equal(r.corpo.itens.length, 2);
        assert.equal(r.corpo.total, 5);
        assert.equal(r.corpo.totalPaginas, 3);
        assert.deepEqual(r.corpo.itens.map((p) => p.nome), ["Café", "Suco"]); // na ordem de criação
    });

    test("a última página traz só o que sobrou", async () => {
        const r = await amb.logado<PaginaJson<ProdutoJson>>("GET", "/produtos?pagina=3&limite=2");
        assert.deepEqual(r.corpo.itens.map((p) => p.nome), ["Torta"]);
    });

    test("página depois do fim devolve lista vazia (e não erro)", async () => {
        const r = await amb.logado<PaginaJson<ProdutoJson>>("GET", "/produtos?pagina=99&limite=2");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.itens.length, 0);
    });

    const invalidos = ["pagina=0", "pagina=-1", "pagina=abc", "limite=0", "limite=51", "limite=1.5", "pagina=1&pagina=2"];
    for (const consulta of invalidos) {
        test(`paginação inválida (?${consulta}) devolve 400`, async () => {
            const r = await amb.logado("GET", `/produtos?${consulta}`);
            assert.equal(r.status, 400);
        });
    }
});
