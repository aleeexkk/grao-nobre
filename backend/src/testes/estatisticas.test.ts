import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { iniciar } from "./ambiente";
import type { Ambiente } from "./ambiente";

interface VendaJson {
    id: number;
    idPedido: number;
    data: string;
    hora: number;
    produto: string;
    categoria: string;
    quantidade: number;
    valorUnitario: number;
}
interface RespostaVendas {
    dias: number;
    vendas: VendaJson[];
}

describe("API de estatísticas (GET /estatisticas/vendas)", () => {
    let amb: Ambiente;

    before(async () => {
        amb = await iniciar();
    });
    after(() => amb.fechar());

    test("sem token devolve 401", async () => {
        assert.equal((await amb.chamar("GET", "/estatisticas/vendas")).status, 401);
    });

    test("sem nenhuma venda: lista vazia e período padrão de 30 dias", async () => {
        const r = await amb.logado<RespostaVendas>("GET", "/estatisticas/vendas");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.dias, 30);
        assert.deepEqual(r.corpo.vendas, []);
    });

    test("só pedidos PAGOS viram venda (aberto e cancelado ficam de fora)", async () => {
        const categoria = await amb.criarCategoria("Bebidas");
        const cafe = await amb.criarProduto("Café", 6, categoria.id);
        const suco = await amb.criarProduto("Suco", 8, categoria.id);

        const pago = await amb.criarPedido();
        await amb.adicionarItem(pago.id, cafe.id, 2);
        await amb.adicionarItem(pago.id, suco.id, 1);
        await amb.mudarStatus(pago.id, "pago");

        const aberto = await amb.criarPedido();
        await amb.adicionarItem(aberto.id, cafe.id, 5);

        const cancelado = await amb.criarPedido();
        await amb.adicionarItem(cancelado.id, suco.id, 9);
        await amb.mudarStatus(cancelado.id, "cancelado");

        const r = await amb.logado<RespostaVendas>("GET", "/estatisticas/vendas");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.vendas.length, 2); // só os 2 itens do pedido pago

        const venda = r.corpo.vendas.find((v) => v.produto === "Café");
        assert.ok(venda);
        assert.equal(venda.idPedido, pago.id);
        assert.equal(venda.categoria, "Bebidas");
        assert.equal(venda.quantidade, 2);
        assert.equal(venda.valorUnitario, 6);
        assert.match(venda.data, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(Number.isInteger(venda.hora) && venda.hora >= 0 && venda.hora <= 23);
    });

    test("aceita ?dias= e devolve o período pedido", async () => {
        const r = await amb.logado<RespostaVendas>("GET", "/estatisticas/vendas?dias=7");
        assert.equal(r.status, 200);
        assert.equal(r.corpo.dias, 7);
    });

    const invalidos = ["dias=0", "dias=-1", "dias=366", "dias=abc", "dias=1.5", "dias=7&dias=30"];
    for (const consulta of invalidos) {
        test(`período inválido (?${consulta}) devolve 400`, async () => {
            const r = await amb.logado("GET", `/estatisticas/vendas?${consulta}`);
            assert.equal(r.status, 400);
        });
    }
});
