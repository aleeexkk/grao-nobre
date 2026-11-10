// Conta as FALHAS de login de cada "chave" (origem + e-mail) pra barrar quem tenta adivinhar a senha.
// Guarda tudo na memória: é simples e basta pra uma API de uma instância só (reiniciar o servidor zera a conta).
interface Registro {
    falhas: number; // quantas vezes errou dentro da janela
    expiraEm: number; // momento (em milissegundos) em que a conta zera sozinha
}

export class LimitadorDeTentativas {
    private readonly maximoDeFalhas: number;
    private readonly janelaEmMs: number;
    private readonly agora: () => number; // o relógio entra "de fora": os testes avançam o tempo sem esperar
    private readonly registros = new Map<string, Registro>();

    // Teto de chaves guardadas: impede que alguém encha a memória do servidor mandando e-mails diferentes
    private static readonly MAXIMO_DE_CHAVES = 10_000;

    constructor(maximoDeFalhas = 10, janelaEmMs = 15 * 60 * 1000, agora: () => number = Date.now) {
        this.maximoDeFalhas = maximoDeFalhas;
        this.janelaEmMs = janelaEmMs;
        this.agora = agora;
    }

    // Quantos segundos faltam pra poder tentar de novo (0 = pode tentar agora)
    segundosDeEspera(chave: string): number {
        const registro = this.registros.get(chave);
        if (registro === undefined) return 0;

        const falta = registro.expiraEm - this.agora();
        if (falta <= 0) {
            this.registros.delete(chave); // a janela acabou: começa do zero
            return 0;
        }
        return registro.falhas >= this.maximoDeFalhas ? Math.ceil(falta / 1000) : 0;
    }

    // Anota uma falha. A janela começa na primeira falha e depois de um tempo a conta zera sozinha
    registrarFalha(chave: string): void {
        const agora = this.agora();
        const registro = this.registros.get(chave);

        if (registro === undefined || registro.expiraEm <= agora) {
            this.abrirEspaco(agora);
            this.registros.set(chave, { falhas: 1, expiraEm: agora + this.janelaEmMs });
        } else {
            registro.falhas += 1;
        }
    }

    // Login certo: esquece as falhas dessa chave
    registrarSucesso(chave: string): void {
        this.registros.delete(chave);
    }

    // Se a memória encheu, joga fora primeiro o que já venceu e, se precisar, o registro mais antigo
    private abrirEspaco(agora: number): void {
        if (this.registros.size < LimitadorDeTentativas.MAXIMO_DE_CHAVES) return;

        for (const [chave, registro] of this.registros) {
            if (registro.expiraEm <= agora) this.registros.delete(chave);
        }
        if (this.registros.size >= LimitadorDeTentativas.MAXIMO_DE_CHAVES) {
            const maisAntiga = this.registros.keys().next();
            if (maisAntiga.done !== true) this.registros.delete(maisAntiga.value);
        }
    }
}
