import { useContext } from "react";
import { AuthContexto } from "./AuthContexto";
import type { ValorAuth } from "./AuthContexto";

// Atalho pras telas lerem o contexto: const { usuario, sair } = useAuth();
export function useAuth(): ValorAuth {
    const valor = useContext(AuthContexto);
    if (valor === null) {
        throw new Error("useAuth precisa ser usado dentro do AuthProvider.");
    }
    return valor;
}
