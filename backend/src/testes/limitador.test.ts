import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { LimitadorDeTentativas } from "../servicos/LimitadorDeTentativas";

// Testes do limitador SEM servidor: o relógio é falso, então "avançar o tempo" não custa nada
describe("LimitadorDeTentativas (trava de tentativas de login)", () => {
    // Relógio de mentira que a gente controla
    function criar(maximo = 3, janelaEmMs = 60_000) {
        let agora = 1_000_000;
        const limitador = new LimitadorDeTentativas(maximo, janelaEmMs, () => agora);
        return { limitador, avancar: (ms: number) => (agora += ms) };
    }

    test("começa liberado e só trava quando chega no máximo de falhas", () => {
        const { limitador } = criar(3);
        assert.equal(limitador.segundosDeEspera("a|x"), 0);

        limitador.registrarFalha("a|x");
        limitador.registrarFalha("a|x");
        assert.equal(limitador.segundosDeEspera("a|x"), 0); // 2 falhas: ainda pode tentar

        limitador.registrarFalha("a|x");
        assert.equal(limitador.segundosDeEspera("a|x"), 60); // 3 falhas: trava pela janela inteira
    });

    test("a espera diminui com o tempo e a trava some quando a janela acaba", () => {
        const { limitador, avancar } = criar(2, 60_000);
        limitador.registrarFalha("a|x");
        limitador.registrarFalha("a|x");

        avancar(45_000);
        assert.equal(limitador.segundosDeEspera("a|x"), 15);

        avancar(15_000); // a janela de 60 s terminou
        assert.equal(limitador.segundosDeEspera("a|x"), 0);

        limitador.registrarFalha("a|x"); // e a conta recomeça do zero (1 falha, não 3)
        assert.equal(limitador.segundosDeEspera("a|x"), 0);
    });

    test("login certo zera as falhas daquela chave", () => {
        const { limitador } = criar(3);
        limitador.registrarFalha("a|x");
        limitador.registrarFalha("a|x");
        limitador.registrarSucesso("a|x");

        limitador.registrarFalha("a|x");
        limitador.registrarFalha("a|x");
        assert.equal(limitador.segundosDeEspera("a|x"), 0); // só 2 falhas desde o sucesso
    });

    test("cada chave tem a sua conta (travar um e-mail não trava os outros)", () => {
        const { limitador } = criar(1);
        limitador.registrarFalha("a|x");
        assert.ok(limitador.segundosDeEspera("a|x") > 0);
        assert.equal(limitador.segundosDeEspera("a|y"), 0);
        assert.equal(limitador.segundosDeEspera("b|x"), 0);
    });
});
