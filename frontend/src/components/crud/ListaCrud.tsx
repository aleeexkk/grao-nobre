import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useDados } from "../../hooks/useDados";
import { useMensagemFlash } from "../../hooks/useMensagemFlash";
import { mensagemDeErro } from "../../servicos/api";
import type { Pagina } from "../../servicos/crud";
import Paginacao from "./Paginacao";

// Uma coluna da tabela: o título e como desenhar a célula de cada registro
export interface ColunaLista<T> {
    titulo: string;
    renderizar: (item: T) => ReactNode;
    classe?: string; // ex: "numero" alinha à direita
}

interface ListaCrudProps<T extends { id: number }> {
    titulo: string; // ex: "Produtos"
    buscarPagina: (pagina: number, limite: number) => Promise<Pagina<T>>; // PRECISA ser estável (definida fora do componente ou com useCallback)
    excluir: (id: number) => Promise<void>;
    colunas: ColunaLista<T>[];
    confirmarExclusao: (item: T) => string; // ex: 'Excluir o produto "Café"?'
    mensagemExcluido: string; // ex: "Produto excluído com sucesso."
    mensagemVazia: string; // ex: "Nenhum produto cadastrado ainda."
    rotaNovo?: string; // sem isso, o botão "Novo" não aparece
    textoNovo?: string;
    rotaEditar?: (item: T) => string; // sem isso, o botão "Editar" não aparece
    podeEditar?: (item: T) => boolean; // esconde o "Editar" de alguns registros (ex: pedido já pago)
    podeExcluir?: (item: T) => boolean;
    acoesExtras?: (item: T) => ReactNode; // botões a mais por linha (ex: "Abrir itens")
    recarga?: number; // a tela de fora aumenta esse número pra forçar a lista a buscar de novo
    aoMudar?: () => void; // avisa a tela de fora que algo foi apagado (ex: pra recalcular o total do pedido)
    embutida?: boolean; // true = lista dentro de outra tela (usa <section> e <h2> em vez de <main> e <h1>)
    limite?: number; // itens por página
}

// Tabela GENÉRICA de listagem: busca página por página, mostra carregando/erro/vazio,
// e cuida da exclusão com confirmação. Serve para categorias, produtos, pedidos e itens.
// <T extends { id: number }> = qualquer registro, desde que tenha um "id" numérico.
export default function ListaCrud<T extends { id: number }>({
    titulo,
    buscarPagina,
    excluir,
    colunas,
    confirmarExclusao,
    mensagemExcluido,
    mensagemVazia,
    rotaNovo,
    textoNovo = "Novo",
    rotaEditar,
    podeEditar,
    podeExcluir,
    acoesExtras,
    recarga = 0,
    aoMudar,
    embutida = false,
    limite = 10,
}: ListaCrudProps<T>) {
    const [pagina, setPagina] = useState(1);
    const [recargaInterna, setRecargaInterna] = useState(0); // aumenta depois de apagar, pra buscar de novo
    const [confirmandoId, setConfirmandoId] = useState<number | null>(null); // qual linha está perguntando "tem certeza?"
    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState("");
    const mensagemDaTelaAnterior = useMensagemFlash();
    const [aviso, setAviso] = useState(mensagemDaTelaAnterior); // mensagem de sucesso (vinda da tela anterior ou da exclusão)

    // useCallback mantém a MESMA função enquanto a página não muda (senão buscaria dados em loop)
    const carregar = useCallback(() => buscarPagina(pagina, limite), [buscarPagina, pagina, limite]);
    const { dados, erro, carregando } = useDados(carregar, recarga + recargaInterna);

    async function confirmarExclusaoDe(item: T) {
        setExcluindo(true);
        setErroExclusao("");
        try {
            await excluir(item.id);
            setAviso(mensagemExcluido);
            setConfirmandoId(null);
            // Apagou o único item da última página? Volta uma página (senão a tela ficaria vazia)
            if (dados !== null && dados.itens.length === 1 && pagina > 1) {
                setPagina(pagina - 1);
            }
            setRecargaInterna((n) => n + 1);
            if (aoMudar) aoMudar();
        } catch (e) {
            // Ex: 409 "Não é possível excluir: este registro está sendo usado em outro lugar."
            setAviso("");
            setErroExclusao(mensagemDeErro(e));
            setConfirmandoId(null);
        } finally {
            setExcluindo(false);
        }
    }

    const Moldura = embutida ? "section" : "main";
    const Titulo = embutida ? "h2" : "h1";

    return (
        <Moldura className={embutida ? "lista-crud lista-embutida" : "lista-crud"}>
            <div className="barra-lista">
                <Titulo>{titulo}</Titulo>
                {rotaNovo !== undefined && (
                    <Link to={rotaNovo} className="botao">
                        {textoNovo}
                    </Link>
                )}
            </div>

            {aviso !== "" && (
                <p className="sucesso-api" role="status">
                    {aviso}
                </p>
            )}
            {erroExclusao !== "" && (
                <p className="erro-api" role="alert">
                    {erroExclusao}
                </p>
            )}

            {/* Primeira busca ainda em andamento */}
            {dados === null && carregando && <p className="estado-lista">Carregando...</p>}

            {/* Deu erro ao buscar */}
            {erro !== "" && (
                <div className="erro-api" role="alert">
                    <p>{erro}</p>
                    <button type="button" className="botao-pequeno" onClick={() => setRecargaInterna((n) => n + 1)}>
                        Tentar de novo
                    </button>
                </div>
            )}

            {dados !== null && dados.itens.length === 0 && erro === "" && (
                <p className="estado-lista">
                    {dados.total === 0 ? mensagemVazia : "Não há registros nesta página. Volte para a anterior."}
                </p>
            )}

            {dados !== null && dados.itens.length > 0 && (
                <div className={carregando ? "tabela-rolagem atualizando" : "tabela-rolagem"}>
                    <table className="tabela">
                        <thead>
                            <tr>
                                {colunas.map((coluna) => (
                                    <th key={coluna.titulo} className={coluna.classe}>
                                        {coluna.titulo}
                                    </th>
                                ))}
                                <th className="coluna-acoes">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dados.itens.map((item) => (
                                <tr key={item.id}>
                                    {colunas.map((coluna) => (
                                        <td key={coluna.titulo} className={coluna.classe}>
                                            {coluna.renderizar(item)}
                                        </td>
                                    ))}
                                    <td className="coluna-acoes">
                                        {confirmandoId === item.id ? (
                                            // Confirmação na própria linha (sem janela do navegador)
                                            <span className="confirmacao" role="alert">
                                                <span>{confirmarExclusao(item)}</span>
                                                <button
                                                    type="button"
                                                    className="botao-pequeno botao-perigo"
                                                    disabled={excluindo}
                                                    onClick={() => void confirmarExclusaoDe(item)}
                                                >
                                                    {excluindo ? "Excluindo..." : "Sim, excluir"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="botao-pequeno botao-secundario"
                                                    disabled={excluindo}
                                                    onClick={() => setConfirmandoId(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            </span>
                                        ) : (
                                            <span className="acoes">
                                                {acoesExtras && acoesExtras(item)}
                                                {rotaEditar !== undefined && (podeEditar ? podeEditar(item) : true) && (
                                                    <Link to={rotaEditar(item)} className="botao-pequeno botao-secundario">
                                                        Editar
                                                    </Link>
                                                )}
                                                {(podeExcluir ? podeExcluir(item) : true) && (
                                                    <button
                                                        type="button"
                                                        className="botao-pequeno botao-perigo"
                                                        onClick={() => {
                                                            setErroExclusao("");
                                                            setAviso("");
                                                            setConfirmandoId(item.id);
                                                        }}
                                                    >
                                                        Excluir
                                                    </button>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {dados !== null && dados.total > 0 && (
                <Paginacao
                    pagina={dados.pagina}
                    totalPaginas={dados.totalPaginas}
                    total={dados.total}
                    aoMudar={(nova) => {
                        setConfirmandoId(null);
                        setPagina(nova);
                    }}
                    desabilitado={carregando}
                />
            )}
        </Moldura>
    );
}
