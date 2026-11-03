import { Navigate, Outlet } from "react-router-dom";
import CabecalhoLogado from "./CabecalhoLogado";
import { useAuth } from "../contexto/useAuth";

// "Porteiro" das telas que exigem login. Funciona como moldura: as telas protegidas
// (Painel, Perfil) aparecem no lugar do <Outlet />, embaixo do cabeçalho.
export default function AreaLogada() {
    const { usuario, carregando } = useAuth();

    // Ainda conferindo se o token guardado vale: espera (senão piscaria a tela de login)
    if (carregando) {
        return (
            <main>
                <p>Carregando...</p>
            </main>
        );
    }

    // Ninguém logado: manda pro login
    if (usuario === null) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            <CabecalhoLogado />
            <Outlet />
        </>
    );
}
