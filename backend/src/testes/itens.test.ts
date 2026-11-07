import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { iniciar } from "./ambiente";
import type { Ambiente, ItemJson, PaginaJson, PedidoJson, ProdutoJson } from "./ambiente";

describe("API de itens do pedido", () => {
    let amb: Ambiente;
    let cafe: ProdutoJson; // R$ 6,00
    let pao: ProdutoJson; // R$ 4,50

    before(async () => {
        amb = await iniciar();
        const categoria = await amb.criarCategoria("Cardápio");
        cafe = await amb.criarProduto("Café Expresso", 6, categoria.id);
        pao = await amb.criarProduto("Pão de Queijo", 4.5, categoria.id);
    });
    after(() => amb.fechar());

    describe("proteção por login", () => {
        const rotas = [
            ["GET", "/itens-pedido"],
            ["POST", "/itens-pedido"],
            ["GET", "/itens-pedido/1"],
            ["PUT", "/itens-pedido/1"],
            ["DELETE", "/itens-pedido/1"],
        ];
        for (const [metodo, caminho] of rotas) {
            test(`${metodo} ${caminho} sem token devolve 401`, async () => {
                const corpo = metodo === "POST" || metodo === "PUT" ? { idPedido: 1, idProduto: 1, quantidade: 1 } : undefined;
                const r = await amb.chamar(metodo!, caminho!, corpo);
                assert.equal(r.status, 401);
            });
        }

        test("token falso devolve 401", async () => {
            const r = await amb.chamar("GET", "/itens-pedido", undefined, "token.falso.aqui");
            assert.equal(r.status, 401);
        });
    });

    describe("criar (POST /itens-pedido)", () => {
        test("cria, devolve 201 com o nome do produto, o preço copiado e o subtotal", async () => {
            const pedido = await amb.criarPedido();
            const r = await amb.logado<ItemJson>("POST", "/itens-pedido", { idPedido: pedido.id, idProduto: cafe.id, quantidade: 3 });
            assert.equal(r.status, 201);
            assert.equal(typeof r.corpo.id, "number");
            assert.equal(r.corpo.idPedido, pedido.id);
            assert.equal(r.corpo.idProduto, cafe.id);
            assert.equal(r.corpo.produto, "Café Expresso");
            assert.equal(r.corpo.quantidade, 3);
            assert.equal(r.corpo.precoUnitario, 6);
            assert.equal(r.corpo.subtotal, 18);
        });

        test("o total e a quantidade de itens do pedido são atualizados", async () => {
            const pedido = await amb.criarPedido();
            await amb.adicionarItem(pedido.id, cafe.id, 2); // 12,00
            await amb.adicionarItem(pedido.id, pao.id, 3); // 13,50
            const r = await amb.logado<PedidoJson>("GET", `/pedidos/${pedido.id}`);
            assert.equal(r.corpo.quantidadeItens, 2);
            assert.equal(r.corpo.total, 25.5);
        });

        test("o preço fica 'congelado': mudar o preço do produto depois NÃO muda o item", async () => {
            const categoria = await amb.criarCategoria("Temporada");
            const produto = await amb.criarProduto("Chocolate Quente", 8, categoria.id);
            const pedido = await amb.criarPedido();
            const item = await amb.adicionarItem(pedido.id, produto.id, 1);

            await amb.logado("PUT", `/produtos/${produto.id}`, { nome: "Chocolate Quente", preco: 12, idCategoria: categoria.id });

            const lido = await amb.logado<ItemJson>("GET", `/itens-pedido/${item.id}`);
            assert.equal(lido.corpo.precoUnitario, 8); // continua o preço de quando foi vendido
        });

        test("o mesmo produto em pedidos DIFERENTES é permitido", async () => {
            const a = await amb.criarPedido();
            const b = await amb.criarPedido();
            assert.equal((await amb.logado("POST", "/itens-pedido", { idPedido: a.id, idProduto: pao.id, quantidade: 1 })).status, 201);
            assert.equal((await amb.logado("POST", "/itens-pedido", { idPedido: b.id, idProduto: pao.id, quantidade: 1 })).status, 201);
        });

        test("o mesmo produto duas vezes no MESMO pedido devolve 409", async () => {
            const pedido = await amb.criarPedido();
            await amb.adicionarItem(pedido.id, cafe.id, 1);
            const r = await amb.logado("POST", "/itens-pedido", { idPedido: pedido.id, idProduto: cafe.id, quantidade: 1 });
            assert.equal(r.status, 409);
        });

        test("produto que não existe devolve 400", async () => {
            const pedido = await amb.criarPedido();
            const r = await amb.logado<{ erro: string }>("POST", "/itens-pedido", { idPedido: pedido.id, idProduto: 99999, quantidade: 1 });
            assert.equal(r.status, 400);
            assert.equal(r.corpo.erro, "O produto informado não existe.");
        });

        test("pedido que não existe devolve 400", async () => {
            const r = await amb.logado<{ erro: string }>("POST", "/itens-pedido", { idPedido: 99999, idProduto: cafe.id, quantidade: 1 });
            assert.equal(r.status, 400);
            assert.equal(r.corpo.erro, "O pedido informado não existe.");
        });

        // Cada caso inválido vira um teste próprio
        const invalidos: Array<[string, unknown]> = [
            ["sem pedido", { idProduto: 1, quantidade: 1 }],
            ["sem produto", { idPedido: 1, quantidade: 1 }],
            ["sem quantidade", { idPedido: 1, idProduto: 1 }],
            ["pedido em texto", { idPedido: "1", idProduto: 1, quantidade: 1 }],
            ["produto em texto", { idPedido: 1, idProduto: "1", quantidade: 1 }],
            ["quantidade em texto (\"2\")", { idPedido: 1, idProduto: 1, quantidade: "2" }],
            ["quantidade zero", { idPedido: 1, idProduto: 1, quantidade: 0 }],
            ["quantidade negativa", { idPedido: 1, idProduto: 1, quantidade: -2 }],
            ["quantidade com decimal (1,5)", { idPedido: 1, idProduto: 1, quantidade: 1.5 }],
            ["quantidade acima de 999", { idPedido: 1, idProduto: 1, quantidade: 1000 }],
            ["pedido zero", { idPedido: 0, idProduto: 1, quantidade: 1 }],
            ["produto negativo", { idPedido: 1, idProduto: -1, quantidade: 1 }],
        ];
        for (const [descricao, corpo] of invalidos) {
            test(`${descricao} devolve 400`, async () => {
                const r = await amb.logado("POST", "/itens-pedido", corpo);
                assert.equal(r.status, 400);
            });
        }

        test("sem corpo nenhum devolve 400", async () => {
            const r = await amb.logado("POST", "/itens-pedido");
            assert.equal(r.status, 400);
        });
    });

    describe("pedido finalizado não aceita mexer nos itens (409)", () => {
        // Prepara um pedido com 1 item e já o finaliza do jeito pedido
        async function pedidoFinalizado(status: string): Promise<{ idPedido: number; idItem: number }> {
            const pedido = await amb.criarPedido();
            const item = await amb.adicionarItem(pedido.id, cafe.id, 1);
            await amb.mudarStatus(pedido.id, status);
            return { idPedido: pedido.id, idItem: item.id };
        }

        for (const status of ["pago", "cancelado"]) {
            test(`pedido ${status}: não aceita item novo`, async () => {
                const { idPedido } = await pedidoFinalizado(status);
                const r = await amb.logado("POST", "/itens-pedido", { idPedido, idProduto: pao.id, quantidade: 1 });
                assert.equal(r.status, 409);
            });

            test(`pedido ${status}: não aceita editar item`, async () => {
                const { idPedido, idItem } = await pedidoFinalizado(status);
                const r = await amb.logado("PUT", `/itens-pedido/${idItem}`, { idPedido, idProduto: cafe.id, quantidade: 5 });
                assert.equal(r.status, 409);
            });

            test(`pedido ${status}: não aceita apagar item`, async () => {
                const { idItem } = await pedidoFinalizado(status);
                assert.equal((await amb.logado("DELETE", `/itens-pedido/${idItem}`)).status, 409);
                assert.equal((await amb.logado("GET", `/itens-pedido/${idItem}`)).status, 200); // continua lá
            });
        }
    });

    describe("buscar (GET /itens-pedido/:id)", () => {
        test("devolve o item", async () => {
            const pedido = await amb.criarPedido();
            const criado = await amb.adicionarItem(pedido.id, pao.id, 2);
            const r = await amb.logado<ItemJson>("GET", `/itens-pedido/${criado.id}`);
            assert.equal(r.status, 200);
            assert.deepEqual(r.corpo, criado);
        });

        test("id que não existe devolve 404", async () => {
            const r = await amb.logado<{ erro: string }>("GET", "/itens-pedido/99999");
            assert.equal(r.status, 404);
            assert.equal(r.corpo.erro, "Item não encontrado.");
        });

        for (const id of ["abc", "0", "-1", "1.5"]) {
            test(`id inválido "${id}" devolve 400`, async () => {
                const r = await amb.logado("GET", `/itens-pedido/${id}`);
                assert.equal(r.status, 400);
            });
        }
    });

    describe("editar (PUT /itens-pedido/:id)", () => {
        test("altera a quantidade e o total do pedido acompanha", async () => {
            const pedido = await amb.criarPedido();
            const item = await amb.adicionarItem(pedido.id, cafe.id, 1);

            const r = await amb.logado<ItemJson>("PUT", `/itens-pedido/${item.id}`, { idPedido: pedido.id, idProduto: cafe.id, quantidade: 4 });
            assert.equal(r.status, 200);
            assert.equal(r.corpo.quantidade, 4);
            assert.equal(r.corpo.subtotal, 24);

            const lido = await amb.logado<PedidoJson>("GET", `/pedidos/${pedido.id}`);
            assert.equal(lido.corpo.total, 24);
        });

        test("trocar o PRODUTO do item devolve 400 (tem que apagar e criar outro)", async () => {
            const pedido = await amb.criarPedido();
            const item = await amb.adicionarItem(pedido.id, cafe.id, 1);
            const r = await amb.logado("PUT", `/itens-pedido/${item.id}`, { idPedido: pedido.id, idProduto: pao.id, quantidade: 1 });
            assert.equal(r.status, 400);
        });

        test("mover o item pra OUTRO pedido devolve 400", async () => {
            const a = await amb.criarPedido();
            const b = await amb.criarPedido();
            const item = await amb.adicionarItem(a.id, cafe.id, 1);
            const r = await amb.logado("PUT", `/itens-pedido/${item.id}`, { idPedido: b.id, idProduto: cafe.id, quantidade: 1 });
            assert.equal(r.status, 400);
        });

        test("quantidade inválida devolve 400", async () => {
            const pedido = await amb.criarPedido();
            const item = await amb.adicionarItem(pedido.id, cafe.id, 1);
            const r = await amb.logado("PUT", `/itens-pedido/${item.id}`, { idPedido: pedido.id, idProduto: cafe.id, quantidade: 0 });
            assert.equal(r.status, 400);
        });

        test("id que não existe devolve 404", async () => {
            const pedido = await amb.criarPedido();
            const r = await amb.logado("PUT", "/itens-pedido/99999", { idPedido: pedido.id, idProduto: cafe.id, quantidade: 1 });
            assert.equal(r.status, 404);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("PUT", "/itens-pedido/abc", { idPedido: 1, idProduto: 1, quantidade: 1 });
            assert.equal(r.status, 400);
        });
    });

    describe("excluir (DELETE /itens-pedido/:id)", () => {
        test("apaga (204), o item some e o total do pedido diminui", async () => {
            const pedido = await amb.criarPedido();
            await amb.adicionarItem(pedido.id, cafe.id, 1); // 6,00
            const item = await amb.adicionarItem(pedido.id, pao.id, 2); // 9,00

            const r = await amb.logado("DELETE", `/itens-pedido/${item.id}`);
            assert.equal(r.status, 204);
            assert.equal((await amb.logado("GET", `/itens-pedido/${item.id}`)).status, 404);

            const lido = await amb.logado<PedidoJson>("GET", `/pedidos/${pedido.id}`);
            assert.equal(lido.corpo.total, 6);
            assert.equal(lido.corpo.quantidadeItens, 1);
        });

        test("apagar de novo (ou id que não existe) devolve 404", async () => {
            const pedido = await amb.criarPedido();
            const item = await amb.adicionarItem(pedido.id, cafe.id, 1);
            await amb.logado("DELETE", `/itens-pedido/${item.id}`);
            assert.equal((await amb.logado("DELETE", `/itens-pedido/${item.id}`)).status, 404);
            assert.equal((await amb.logado("DELETE", "/itens-pedido/99999")).status, 404);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("DELETE", "/itens-pedido/abc");
            assert.equal(r.status, 400);
        });
    });
});

describe("API de itens do pedido: listagem, filtro por pedido e paginação", () => {
    let amb: Ambiente;
    let pedidoA: number;
    let pedidoB: number;

    // Pedido A com 3 itens, pedido B com 1 item
    before(async () => {
        amb = await iniciar();
        const categoria = await amb.criarCategoria("Cardápio");
        const cafe = await amb.criarProduto("Café", 5, categoria.id);
        const pao = await amb.criarProduto("Pão", 3, categoria.id);
        const bolo = await amb.criarProduto("Bolo", 10, categoria.id);
        pedidoA = (await amb.criarPedido("A")).id;
        pedidoB = (await amb.criarPedido("B")).id;
        await amb.adicionarItem(pedidoA, cafe.id, 1);
        await amb.adicionarItem(pedidoA, pao.id, 2);
        await amb.adicionarItem(pedidoA, bolo.id, 3);
        await amb.adicionarItem(pedidoB, cafe.id, 4);
    });
    after(() => amb.fechar());

    test("sem filtro: lista os itens de TODOS os pedidos", async () => {
        const r = await amb.logado<PaginaJson<ItemJson>>("GET", "/itens-pedido");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.total, 4);
        assert.equal(r.corpo.pagina, 1);
        assert.equal(r.corpo.limite, 10);
    });

    test("?idPedido= lista só os itens daquele pedido", async () => {
        const a = await amb.logado<PaginaJson<ItemJson>>("GET", `/itens-pedido?idPedido=${pedidoA}`);
        assert.equal(a.corpo.total, 3);
        assert.deepEqual(a.corpo.itens.map((i) => i.produto), ["Café", "Pão", "Bolo"]);
        assert.ok(a.corpo.itens.every((i) => i.idPedido === pedidoA));

        const b = await amb.logado<PaginaJson<ItemJson>>("GET", `/itens-pedido?idPedido=${pedidoB}`);
        assert.equal(b.corpo.total, 1);
    });

    test("filtro de um pedido que não tem itens (ou não existe) devolve lista vazia", async () => {
        const r = await amb.logado<PaginaJson<ItemJson>>("GET", "/itens-pedido?idPedido=99999");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.total, 0);
        assert.equal(r.corpo.itens.length, 0);
    });

    test("filtro + paginação: limite 2 do pedido A dá 2 páginas", async () => {
        const p1 = await amb.logado<PaginaJson<ItemJson>>("GET", `/itens-pedido?idPedido=${pedidoA}&pagina=1&limite=2`);
        assert.equal(p1.corpo.itens.length, 2);
        assert.equal(p1.corpo.total, 3);
        assert.equal(p1.corpo.totalPaginas, 2);

        const p2 = await amb.logado<PaginaJson<ItemJson>>("GET", `/itens-pedido?idPedido=${pedidoA}&pagina=2&limite=2`);
        assert.deepEqual(p2.corpo.itens.map((i) => i.produto), ["Bolo"]);
    });

    const invalidos = ["idPedido=abc", "idPedido=0", "idPedido=-1", "idPedido=1.5", "idPedido=1&idPedido=2", "pagina=0", "limite=51"];
    for (const consulta of invalidos) {
        test(`consulta inválida (?${consulta}) devolve 400`, async () => {
            const r = await amb.logado("GET", `/itens-pedido?${consulta}`);
            assert.equal(r.status, 400);
        });
    }

    test("filtros que a rota não conhece são ignorados (não viram SQL)", async () => {
        const r = await amb.logado<PaginaJson<ItemJson>>("GET", "/itens-pedido?nome=x&idProduto=1");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.total, 4);
    });
});
