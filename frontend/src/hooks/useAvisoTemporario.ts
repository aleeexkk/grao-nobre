import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

// Quanto tempo o aviso de sucesso fica na tela antes de sumir sozinho
const DURACAO_PADRAO_MS = 5000;

// Funciona como um useState de texto, só que o texto se apaga sozinho depois de alguns segundos.
// Ex: const [aviso, setAviso] = useAvisoTemporario();  →  setAviso("Salvo!") mostra e, 5 s depois, volta a ficar "".
// Quem quiser apagar na hora continua podendo: setAviso("").
export function useAvisoTemporario(
    inicial = "",
    duracaoMs = DURACAO_PADRAO_MS
): [string, Dispatch<SetStateAction<string>>] {
    const [aviso, setAviso] = useState(inicial);

    // Cada vez que o aviso muda, liga um cronômetro novo. Se mudar de novo (ou a tela fechar)
    // antes do tempo acabar, o cronômetro antigo é cancelado: o aviso novo nunca some cedo demais.
    useEffect(() => {
        const cronometro = aviso === "" ? undefined : setTimeout(() => setAviso(""), duracaoMs);
        return () => clearTimeout(cronometro);
    }, [aviso, duracaoMs]);

    return [aviso, setAviso];
}
