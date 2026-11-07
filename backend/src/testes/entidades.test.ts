import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Produto } from "../entidades/Produto";
import { Pedido } from "../entidades/Pedido";
import { ItemPedido } from "../entidades/ItemPedido";
import { ErroValidacao } from "../erros/ErroValidacao";
import { validarOpcao, validarPreco, validarQuantidade } from "../validadores/validadores";

// Testes das CLASSES (sem servidor): conferem o encapsulamento e as validações dos getters/setters
describe("entidade Produto", () => {
    test("guarda os dados já tratados (sem espaços nas pontas)", () => {
        const p = new Produto("  Café  ", "  forte  ", 6.5, 1);
        assert.equal(p.nome, "Café");
        assert.equal(p.descricao, "forte");
        assert.equal(p.preco, 6.5);
        assert.equal(p.idCategoria, 1);
        assert.equal(p.id, null); // ainda não foi salvo
    });

    test("não nasce inválido (o construtor valida)", () => {
        assert.throws(() => new Produto("A", null, 5, 1), ErroValidacao);
        assert.throws(() => new Produto("Café", null, 0, 1), ErroValidacao);
        assert.throws(() => new Produto("Café", null, 5, 0), ErroValidacao);
    });

    test("os setters também validam, e um valor ruim não estraga o que já estava guardado", () => {
        const p = new Produto("Café", null, 6, 1);
        assert.throws(() => (p.preco = -1), ErroValidacao);
        assert.equal(p.preco, 6); // continua o valor antigo
        p.preco = 7.25;
        assert.equal(p.preco, 7.25);
    });
});

describe("entidade Pedido", () => {
    test("nasce 'aberto' e sem cliente por padrão", () => {
        const p = new Pedido(1, null);
        assert.equal(p.status, "aberto");
        assert.equal(p.cliente, null);
        assert.equal(p.idUsuario, 1);
    });

    test("aceita só os 3 status (e ignora maiúscula e espaços)", () => {
        assert.equal(new Pedido(1, null, " PAGO ").status, "pago");
        assert.throws(() => new Pedido(1, null, "entregue"), ErroValidacao);
    });

    test("o setter de status também valida", () => {
        const p = new Pedido(1, "Ana");
        p.status = "cancelado";
        assert.equal(p.status, "cancelado");
        assert.throws(() => (p.status = "xyz"), ErroValidacao);
        assert.equal(p.status, "cancelado");
    });

    test("cliente com mais de 100 letras é recusado; só espaços vira null", () => {
        assert.throws(() => new Pedido(1, "c".repeat(101)), ErroValidacao);
        assert.equal(new Pedido(1, "   ").cliente, null);
    });

    test("usuário inválido é recusado", () => {
        assert.throws(() => new Pedido(0, null), ErroValidacao);
    });
});

describe("entidade ItemPedido", () => {
    test("guarda pedido, produto e quantidade", () => {
        const i = new ItemPedido(3, 4, 2);
        assert.equal(i.idPedido, 3);
        assert.equal(i.idProduto, 4);
        assert.equal(i.quantidade, 2);
    });

    test("quantidade precisa ser inteira de 1 a 999 (no construtor e no setter)", () => {
        assert.throws(() => new ItemPedido(1, 1, 0), ErroValidacao);
        assert.throws(() => new ItemPedido(1, 1, 1000), ErroValidacao);
        assert.throws(() => new ItemPedido(1, 1, 1.5), ErroValidacao);
        const i = new ItemPedido(1, 1, 1);
        assert.throws(() => (i.quantidade = -3), ErroValidacao);
        assert.equal(i.quantidade, 1);
        i.quantidade = 999;
        assert.equal(i.quantidade, 999);
    });

    test("pedido ou produto inválido é recusado", () => {
        assert.throws(() => new ItemPedido(0, 1, 1), ErroValidacao);
        assert.throws(() => new ItemPedido(1, -1, 1), ErroValidacao);
    });
});

describe("validadores novos", () => {
    test("validarPreco: centavos certos e limites", () => {
        assert.equal(validarPreco(10.1), 10.1);
        assert.equal(validarPreco(99999.99), 99999.99);
        for (const ruim of [0, -1, 1.005, 100000, Number.NaN, Number.POSITIVE_INFINITY]) {
            assert.throws(() => validarPreco(ruim), ErroValidacao);
        }
    });

    test("validarQuantidade: inteiro de 1 a 999", () => {
        assert.equal(validarQuantidade(1), 1);
        assert.equal(validarQuantidade(999), 999);
        for (const ruim of [0, -1, 1000, 2.5, Number.NaN]) {
            assert.throws(() => validarQuantidade(ruim), ErroValidacao);
        }
    });

    test("validarOpcao (genérica): devolve a opção certa ou erro", () => {
        const cores = ["azul", "verde"] as const;
        assert.equal(validarOpcao("  AZUL ", cores, "cor inválida"), "azul");
        assert.throws(() => validarOpcao("roxo", cores, "cor inválida"), ErroValidacao);
    });
});
