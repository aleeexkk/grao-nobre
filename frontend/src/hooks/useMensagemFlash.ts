import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Lê a mensagem que a tela anterior deixou na navegação (ex: "Categoria cadastrada com sucesso.")
function lerMensagem(estado: unknown): string {
    if (typeof estado === "object" && estado !== null && "mensagem" in estado && typeof estado.mensagem === "string") {
        return estado.mensagem;
    }
    return "";
}

// "Mensagem relâmpago": aparece na tela que acabou de abrir e some se a pessoa recarregar (F5).
// Ex: depois de salvar um formulário, voltamos pra lista com navigate("/produtos", { state: { mensagem: "..." } }).
export function useMensagemFlash(): string {
    const location = useLocation();
    const navigate = useNavigate();
    const [mensagem] = useState(() => lerMensagem(location.state));

    // Limpa o aviso do histórico: se a pessoa apertar F5, ele não volta
    useEffect(() => {
        if (mensagem !== "") {
            navigate(location.pathname + location.search, { replace: true, state: null });
        }
    }, [mensagem, navigate, location.pathname, location.search]);

    return mensagem;
}
