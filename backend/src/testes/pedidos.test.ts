import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { iniciar } from "./ambiente";
import type { Ambiente, ItemJson, PaginaJson, PedidoJson } from "./ambiente";

describe("API de pedidos", () => {
    let amb: Ambiente;
    let idProduto: number; // um produto pronto pra colocar nos pedidos

    before(async () => {
        amb = await iniciar();
        const categoria = await amb.criarCategoria("Bebidas");
        idProduto = (await amb.criarProduto("Café Expresso", 6, categoria.id)).id;
    });
    after(() => amb.fechar());

    describe("proteção por login", () => {
        const rotas = [
            ["GET", "/pedidos"],
            ["POST", "/pedidos"],
            ["GET", "/pedidos/1"],
            ["PUT", "/pedidos/1"],
            ["DELETE", "/pedidos/1"],
        ];
        for (const [metodo, caminho] of rotas) {
            test(`${metodo} ${caminho} sem token devolve 401`, async () => {
                const corpo = metodo === "POST" || metodo === "PUT" ? { cliente: "Qualquer" } : undefined;
                const r = await amb.chamar(metodo!, caminho!, corpo);
                assert.equal(r.status, 401);
            });
        }

        test("token falso devolve 401", async () => {
            const r = await amb.chamar("GET", "/pedidos", undefined, "token.falso.aqui");
            assert.equal(r.status, 401);
        });
    });

    describe("criar (POST /pedidos)", () => {
        test("cria um pedido ABERTO, vazio, com data/hora e o atendente que está logado", async () => {
            const r = await amb.logado<PedidoJson>("POST", "/pedidos", { cliente: "  Maria  " });
            assert.equal(r.status, 201);
            assert.equal(typeof r.corpo.id, "number");
            assert.equal(r.corpo.cliente, "Maria"); // sem os espaços das pontas
            assert.equal(r.corpo.status, "aberto");
            assert.equal(r.corpo.quantidadeItens, 0);
            assert.equal(r.corpo.total, 0);
            assert.equal(r.corpo.atendente, "Ana Lima");
            assert.match(r.corpo.dataHora, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        test("o cliente é opcional (vira null)", async () => {
            const r = await amb.logado<PedidoJson>("POST", "/pedidos", {});
            assert.equal(r.status, 201);
            assert.equal(r.corpo.cliente, null);
        });

        test("não dá pra registrar o pedido 'em nome de outro': o idUsuario do corpo é ignorado", async () => {
            const r = await amb.logado<PedidoJson>("POST", "/pedidos", { cliente: "Teste", idUsuario: 999 });
            assert.equal(r.status, 201);
            assert.notEqual(r.corpo.idUsuario, 999);
            assert.equal(r.corpo.atendente, "Ana Lima");
        });

        const invalidos: Array<[string, unknown]> = [
            ["cliente que não é texto", { cliente: 5 }],
            ["cliente longo demais (101 letras)", { cliente: "c".repeat(101) }],
            ["status que não é texto", { status: 1 }],
            ["status inventado", { status: "entregue" }],
            ["status 'pago' na criação (todo pedido começa aberto)", { status: "pago" }],
            ["status 'cancelado' na criação", { status: "cancelado" }],
        ];
        for (const [descricao, corpo] of invalidos) {
            test(`${descricao} devolve 400`, async () => {
                const r = await amb.logado("POST", "/pedidos", corpo);
                assert.equal(r.status, 400);
            });
        }

        test("sem corpo nenhum também cria (todos os campos do pedido são opcionais)", async () => {
            const r = await amb.logado<PedidoJson>("POST", "/pedidos");
            assert.equal(r.status, 201);
            assert.equal(r.corpo.status, "aberto");
        });
    });

    describe("buscar (GET /pedidos/:id)", () => {
        test("devolve o pedido", async () => {
            const criado = await amb.criarPedido("João");
            const r = await amb.logado<PedidoJson>("GET", `/pedidos/${criado.id}`);
            assert.equal(r.status, 200);
            assert.deepEqual(r.corpo, criado);
        });

        test("id que não existe devolve 404", async () => {
            const r = await amb.logado<{ erro: string }>("GET", "/pedidos/99999");
            assert.equal(r.status, 404);
            assert.equal(r.corpo.erro, "Pedido não encontrado.");
        });

        for (const id of ["abc", "0", "-1", "1.5"]) {
            test(`id inválido "${id}" devolve 400`, async () => {
                const r = await amb.logado("GET", `/pedidos/${id}`);
                assert.equal(r.status, 400);
            });
        }
    });

    describe("editar (PUT /pedidos/:id)", () => {
        test("altera o cliente de um pedido aberto", async () => {
            const criado = await amb.criarPedido("Nome Errado");
            const r = await amb.logado<PedidoJson>("PUT", `/pedidos/${criado.id}`, { cliente: "Nome Certo" });
            assert.equal(r.status, 200);
            assert.equal(r.corpo.cliente, "Nome Certo");
            assert.equal(r.corpo.status, "aberto"); // sem status no corpo, continua aberto
            assert.equal(r.corpo.dataHora, criado.dataHora); // a data/hora não muda
            assert.equal(r.corpo.idUsuario, criado.idUsuario); // o dono não muda
        });

        test("pagar um pedido SEM itens devolve 409", async () => {
            const criado = await amb.criarPedido();
            const r = await amb.mudarStatus(criado.id, "pago");
            assert.equal(r.status, 409);
            assert.equal((await amb.logado<PedidoJson>("GET", `/pedidos/${criado.id}`)).corpo.status, "aberto");
        });

        test("pagar um pedido COM itens funciona e o total bate", async () => {
            const criado = await amb.criarPedido("Paga");
            await amb.adicionarItem(criado.id, idProduto, 3); // 3 x 6,00
            const r = await amb.mudarStatus(criado.id, "pago");
            assert.equal(r.status, 200);
            assert.equal(r.corpo.status, "pago");
            assert.equal(r.corpo.total, 18);
            assert.equal(r.corpo.quantidadeItens, 1);
        });

        test("cancelar um pedido aberto funciona", async () => {
            const criado = await amb.criarPedido();
            const r = await amb.mudarStatus(criado.id, "cancelado");
            assert.equal(r.status, 200);
            assert.equal(r.corpo.status, "cancelado");
        });

        test("pedido PAGO não pode mais ser alterado (409)", async () => {
            const criado = await amb.criarPedido();
            await amb.adicionarItem(criado.id, idProduto, 1);
            await amb.mudarStatus(criado.id, "pago");
            assert.equal((await amb.logado("PUT", `/pedidos/${criado.id}`, { cliente: "Outro" })).status, 409);
            assert.equal((await amb.mudarStatus(criado.id, "cancelado")).status, 409); // nem cancelar depois de pago
        });

        test("pedido CANCELADO não pode mais ser alterado (409)", async () => {
            const criado = await amb.criarPedido();
            await amb.mudarStatus(criado.id, "cancelado");
            assert.equal((await amb.mudarStatus(criado.id, "aberto")).status, 409); // não dá pra reabrir
        });

        test("status inventado devolve 400", async () => {
            const criado = await amb.criarPedido();
            const r = await amb.mudarStatus(criado.id, "entregue");
            assert.equal(r.status, 400);
        });

        test("id que não existe devolve 404", async () => {
            const r = await amb.logado("PUT", "/pedidos/99999", { cliente: "Fantasma" });
            assert.equal(r.status, 404);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("PUT", "/pedidos/abc", { cliente: "Qualquer" });
            assert.equal(r.status, 400);
        });
    });

    describe("excluir (DELETE /pedidos/:id)", () => {
        test("apaga um pedido aberto (204) e os itens dele vão junto", async () => {
            const criado = await amb.criarPedido();
            await amb.adicionarItem(criado.id, idProduto, 2);

            const r = await amb.logado("DELETE", `/pedidos/${criado.id}`);
            assert.equal(r.status, 204);
            assert.equal((await amb.logado("GET", `/pedidos/${criado.id}`)).status, 404);

            const itens = await amb.logado<PaginaJson<ItemJson>>("GET", `/itens-pedido?idPedido=${criado.id}`);
            assert.equal(itens.corpo.total, 0); // os itens também sumiram
        });

        test("apaga um pedido cancelado", async () => {
            const criado = await amb.criarPedido();
            await amb.mudarStatus(criado.id, "cancelado");
            assert.equal((await amb.logado("DELETE", `/pedidos/${criado.id}`)).status, 204);
        });

        test("pedido PAGO não pode ser excluído (409) e continua existindo", async () => {
            const criado = await amb.criarPedido();
            await amb.adicionarItem(criado.id, idProduto, 1);
            await amb.mudarStatus(criado.id, "pago");
            assert.equal((await amb.logado("DELETE", `/pedidos/${criado.id}`)).status, 409);
            assert.equal((await amb.logado("GET", `/pedidos/${criado.id}`)).status, 200);
        });

        test("apagar de novo (ou id que não existe) devolve 404", async () => {
            const criado = await amb.criarPedido();
            await amb.logado("DELETE", `/pedidos/${criado.id}`);
            assert.equal((await amb.logado("DELETE", `/pedidos/${criado.id}`)).status, 404);
            assert.equal((await amb.logado("DELETE", "/pedidos/99999")).status, 404);
        });

        test("id inválido devolve 400", async () => {
            const r = await amb.logado("DELETE", "/pedidos/abc");
            assert.equal(r.status, 400);
        });
    });
});

describe("API de pedidos: listagem com paginação", () => {
    let amb: Ambiente;

    // Começa do zero e cria exatamente 5 pedidos (o último com 1 item), pra os números baterem
    before(async () => {
        amb = await iniciar();
        const categoria = await amb.criarCategoria("Bebidas");
        const produto = await amb.criarProduto("Café", 5, categoria.id);
        for (const cliente of ["P1", "P2", "P3", "P4"]) {
            await amb.criarPedido(cliente);
        }
        const ultimo = await amb.criarPedido("P5");
        await amb.adicionarItem(ultimo.id, produto.id, 2); // 2 x 5,00 = 10
    });
    after(() => amb.fechar());

    test("sem parâmetros: página 1, limite 10 e os 5 pedidos, os MAIS RECENTES primeiro", async () => {
        const r = await amb.logado<PaginaJson<PedidoJson>>("GET", "/pedidos");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.pagina, 1);
        assert.equal(r.corpo.limite, 10);
        assert.equal(r.corpo.total, 5);
        assert.equal(r.corpo.totalPaginas, 1);
        assert.deepEqual(r.corpo.itens.map((p) => p.cliente), ["P5", "P4", "P3", "P2", "P1"]);
    });

    test("cada pedido da lista já traz a quantidade de itens e o total", async () => {
        const r = await amb.logado<PaginaJson<PedidoJson>>("GET", "/pedidos");
        const p5 = r.corpo.itens[0]!;
        assert.equal(p5.quantidadeItens, 1);
        assert.equal(p5.total, 10);
    });

    test("limite 2: página 1 tem 2 itens e são 3 páginas no total", async () => {
        const r = await amb.logado<PaginaJson<PedidoJson>>("GET", "/pedidos?pagina=1&limite=2");
        assert.equal(r.corpo.itens.length, 2);
        assert.equal(r.corpo.totalPaginas, 3);
    });

    test("a última página traz só o que sobrou", async () => {
        const r = await amb.logado<PaginaJson<PedidoJson>>("GET", "/pedidos?pagina=3&limite=2");
        assert.deepEqual(r.corpo.itens.map((p) => p.cliente), ["P1"]);
    });

    test("página depois do fim devolve lista vazia (e não erro)", async () => {
        const r = await amb.logado<PaginaJson<PedidoJson>>("GET", "/pedidos?pagina=99&limite=2");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.itens.length, 0);
    });

    const invalidos = ["pagina=0", "pagina=-1", "pagina=abc", "limite=0", "limite=51", "pagina=1&pagina=2"];
    for (const consulta of invalidos) {
        test(`paginação inválida (?${consulta}) devolve 400`, async () => {
            const r = await amb.logado("GET", `/pedidos?${consulta}`);
            assert.equal(r.status, 400);
        });
    }
});
