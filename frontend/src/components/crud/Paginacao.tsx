// Controles de paginação: "Anterior", "Página X de Y" e "Próxima".
// Fica "burro" de propósito: só mostra e avisa a tela quando a pessoa clica (a tela é quem busca os dados).
interface PaginacaoProps {
    pagina: number; // página atual (começa em 1)
    totalPaginas: number;
    total: number; // quantos registros existem no total
    aoMudar: (novaPagina: number) => void;
    desabilitado?: boolean; // trava os botões enquanto busca os dados
}

export default function Paginacao({ pagina, totalPaginas, total, aoMudar, desabilitado = false }: PaginacaoProps) {
    return (
        <nav className="paginacao" aria-label="Paginação">
            <button type="button" onClick={() => aoMudar(pagina - 1)} disabled={desabilitado || pagina <= 1}>
                Anterior
            </button>
            <span>
                Página {pagina} de {Math.max(totalPaginas, 1)} · {total} {total === 1 ? "registro" : "registros"}
            </span>
            <button
                type="button"
                onClick={() => aoMudar(pagina + 1)}
                disabled={desabilitado || pagina >= totalPaginas}
            >
                Próxima
            </button>
        </nav>
    );
}
