import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface LimiteDeErroProps {
    children: ReactNode;
}

interface EstadoLimite {
    temErro: boolean;
}

// Rede de segurança do site: se alguma tela quebrar por um erro inesperado, em vez de a página ficar em
// branco aparece uma mensagem com um botão pra voltar. (O React só aceita esse recurso em classe.)
export default class LimiteDeErro extends Component<LimiteDeErroProps, EstadoLimite> {
    override state: EstadoLimite = { temErro: false };

    // O React chama isto quando uma tela abaixo lança um erro: é aqui que "ligamos" a tela de erro
    static getDerivedStateFromError(): EstadoLimite {
        return { temErro: true };
    }

    // O detalhe técnico vai só pro console (pra quem for depurar), nunca pra tela da pessoa
    override componentDidCatch(erro: Error, info: ErrorInfo): void {
        console.error("Erro inesperado na tela:", erro, info.componentStack);
    }

    override render(): ReactNode {
        if (this.state.temErro) {
            return (
                <main>
                    <h1>Algo deu errado</h1>
                    <p>Aconteceu um erro inesperado e não foi possível mostrar esta tela.</p>
                    {/* assign (e não reload): leva pra uma tela conhecida, em vez de repetir a que quebrou */}
                    <button type="button" onClick={() => window.location.assign("/dashboard")}>
                        Voltar ao painel
                    </button>
                </main>
            );
        }
        return this.props.children;
    }
}
