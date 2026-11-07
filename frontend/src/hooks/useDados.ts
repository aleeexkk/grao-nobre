import { useEffect, useState } from "react";
import { mensagemDeErro } from "../servicos/api";

// Estado guardado: o resultado + de QUAL pedido ele é (assim a gente sabe se ainda está desatualizado)
interface Resultado<T> {
    carregar: () => Promise<T>;
    recarga: number;
    dados: T | null;
    erro: string;
}

// Busca dados na API quando a tela abre (e de novo quando "carregar" ou "recarga" mudam).
//   carregar = função que faz a chamada. Precisa ser ESTÁVEL: definida fora do componente ou com useCallback
//   recarga  = um número que a tela aumenta pra forçar uma nova busca (ex: depois de pagar o pedido)
// Devolve: os dados (os antigos continuam aparecendo enquanto busca os novos), a mensagem de erro e se está carregando.
export function useDados<T>(carregar: () => Promise<T>, recarga = 0): { dados: T | null; erro: string; carregando: boolean } {
    const [resultado, setResultado] = useState<Resultado<T> | null>(null);

    useEffect(() => {
        let cancelado = false; // evita mexer no estado se a tela já saiu ou pediu outra busca

        carregar()
            .then((dados) => {
                if (!cancelado) setResultado({ carregar, recarga, dados, erro: "" });
            })
            .catch((erro: unknown) => {
                if (!cancelado) setResultado({ carregar, recarga, dados: null, erro: mensagemDeErro(erro) });
            });

        return () => {
            cancelado = true;
        };
    }, [carregar, recarga]);

    const atualizado = resultado !== null && resultado.carregar === carregar && resultado.recarga === recarga;
    return {
        dados: resultado === null ? null : resultado.dados,
        erro: atualizado ? resultado.erro : "",
        carregando: !atualizado,
    };
}
