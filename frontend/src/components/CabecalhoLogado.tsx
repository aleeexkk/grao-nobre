import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/useAuth";
import { primeiroNome } from "../utils/formatacao";

// Barra de cima da área logada: marca, links e o botão de sair
export default function CabecalhoLogado() {
    const { usuario, sair } = useAuth(); // lê quem está logado direto do contexto
    const navigate = useNavigate();

    function aoSair() {
        sair();
        navigate("/login");
    }

    // NavLink deixa o link da página atual "ativo" (sublinhado)
    function classeDoLink({ isActive }: { isActive: boolean }): string {
        return isActive ? "ativo" : "";
    }

    return (
        <header className="cabecalho">
            <span className="cabecalho-marca">Grão Nobre</span>

            <nav>
                <NavLink to="/dashboard" className={classeDoLink}>
                    Painel
                </NavLink>
                <NavLink to="/perfil" className={classeDoLink}>
                    Meu perfil
                </NavLink>
            </nav>

            <div className="cabecalho-usuario">
                {usuario && <span>Olá, {primeiroNome(usuario.nome)}</span>}
                <button type="button" onClick={aoSair}>
                    Sair
                </button>
            </div>
        </header>
    );
}
