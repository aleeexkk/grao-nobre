import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/useAuth";
import { primeiroNome } from "../utils/formatacao";

// Links do menu. Cada ícone é um desenho simples de traços (grade de 24x24) que o CSS pinta na cor do texto.
// Pra ganhar um item novo no menu, é só incluir mais uma linha aqui.
const ITENS_MENU: { para: string; texto: string; icone: ReactNode }[] = [
    // Painel: três barrinhas de gráfico
    { para: "/dashboard", texto: "Painel", icone: <path d="M5 20v-8M12 20V5M19 20v-5" /> },
    // Pedidos: a comanda (papel com bico embaixo e duas linhas)
    {
        para: "/pedidos",
        texto: "Pedidos",
        icone: (
            <>
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                <path d="M9.5 8h5M9.5 12h5" />
            </>
        ),
    },
    // Produtos: xícara com fumaça
    {
        para: "/produtos",
        texto: "Produtos",
        icone: (
            <>
                <path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
                <path d="M16 11.5h1.5a2.5 2.5 0 0 1 0 5h-2.1" />
                <path d="M8.5 3.5v3M12 3.5v3" />
            </>
        ),
    },
    // Categorias: etiqueta
    {
        para: "/categorias",
        texto: "Categorias",
        icone: (
            <>
                <path d="M3.5 12.5v-8h8l9 9-8 8z" />
                <circle cx="7.8" cy="8.8" r="1" />
            </>
        ),
    },
    // Meu perfil: pessoa
    {
        para: "/perfil",
        texto: "Meu perfil",
        icone: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4.5 20c.9-3.8 3.6-6 7.5-6s6.6 2.2 7.5 6" />
            </>
        ),
    },
];

// Barra de cima da área logada: marca, links e o botão de sair
export default function CabecalhoLogado() {
    const { usuario, sair } = useAuth(); // lê quem está logado direto do contexto
    const navigate = useNavigate();

    function aoSair() {
        sair();
        navigate("/login");
    }

    // NavLink deixa o link da página atual "ativo" (fundo creme)
    function classeDoLink({ isActive }: { isActive: boolean }): string {
        return isActive ? "ativo" : "";
    }

    return (
        <header className="cabecalho">
            {/* Clicar na marca leva pro painel */}
            <Link to="/dashboard" className="cabecalho-marca">
                Grão Nobre
            </Link>

            <nav aria-label="Menu principal">
                {ITENS_MENU.map((item) => (
                    <NavLink key={item.para} to={item.para} className={classeDoLink}>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            {item.icone}
                        </svg>
                        {item.texto}
                    </NavLink>
                ))}
            </nav>

            <div className="cabecalho-usuario">
                {usuario && (
                    <>
                        {/* Bolinha com a inicial do nome (enfeite: quem lê a tela já tem o "Olá, ..." ao lado) */}
                        <span className="cabecalho-avatar" aria-hidden="true">
                            {primeiroNome(usuario.nome).charAt(0).toUpperCase()}
                        </span>
                        <span className="cabecalho-ola">Olá, {primeiroNome(usuario.nome)}</span>
                    </>
                )}
                <button type="button" onClick={aoSair}>
                    Sair
                </button>
            </div>
        </header>
    );
}
