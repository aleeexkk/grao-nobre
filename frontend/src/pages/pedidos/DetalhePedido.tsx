import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EtiquetaStatus from "../../components/EtiquetaStatus";
import ListaCrud from "../../components/crud/ListaCrud";
import type { ColunaLista } from "../../components/crud/ListaCrud";
import { useDados } from "../../hooks/useDados";
import { mensagemDeErro } from "../../servicos/api";
import { clienteItensPedido, clientePedidos } from "../../servicos/recursos";
import type { ItemPedido } from "../../servicos/recursos";
import { formatarDataHora, formatarMoeda } from "../../utils/formatacao";
import { lerIdDaRota } from "../../utils/numeros";

const colunas: ColunaLista<ItemPedido>[] = [
    { titulo: "Produto", renderizar: (item) => item.produto },
    { titulo: "Quantidade", classe: "numero", renderizar: (item) => item.quantidade },
    { titulo: "Preço unitário", classe: "numero", renderizar: (item) => formatarMoeda(item.precoUnitario) },
    { titulo: "Subtotal", classe: "numero", renderizar: (item) => formatarMoeda(item.subtotal) },
];

function excluirItem(id: number) {
    return clienteItensPedido.excluir(id);
}

// Tela de UM pedido: dados dele, botões de pagar/cancelar e a lista dos itens
export default function DetalhePedido() {
    const { id } = useParams();
    const idPedido = lerIdDaRota(id) ?? 0;

    const [recarga, setRecarga] = useState(0); // aumenta pra buscar o pedido de novo (total, status)
    const [acaoPendente, setAcaoPendente] = useState<"pago" | "cancelado" | null>(null); // aguardando "tem certeza?"
    const [mudando, setMudando] = useState(false);
    const [erroAcao, setErroAcao] = useState("");
    const [aviso, setAviso] = useState("");

    const carregarPedido = useCallback(() => clientePedidos.buscar(idPedido), [idPedido]);
    const { dados: pedido, erro, carregando } = useDados(carregarPedido, recarga);

    // Só os itens DESTE pedido (o filtro vai na URL: /itens-pedido?idPedido=5)
    const buscarItens = useCallback(
        (pagina: number, limite: number) => clienteItensPedido.listar(pagina, limite, { idPedido }),
        [idPedido]
    );

    async function mudarStatus(novoStatus: "pago" | "cancelado") {
        if (pedido === null) return;
        setMudando(true);
        setErroAcao("");
        setAviso("");
        try {
            await clientePedidos.atualizar(idPedido, { cliente: pedido.cliente, status: novoStatus });
            setAviso(novoStatus === "pago" ? "Pedido marcado como pago." : "Pedido cancelado.");
            setRecarga((n) => n + 1);
        } catch (e) {
            setErroAcao(mensagemDeErro(e)); // ex: 409 "não dá pra pagar um pedido sem itens"
        } finally {
            setMudando(false);
            setAcaoPendente(null);
        }
    }

    if (erro !== "" && pedido === null) {
        return (
            <main>
                <h1>Pedido</h1>
                <p className="erro-api" role="alert">
                    {erro}
                </p>
                <Link to="/pedidos">Voltar para os pedidos</Link>
            </main>
        );
    }

    if (pedido === null) {
        return (
            <main>
                <p>{carregando ? "Carregando..." : ""}</p>
            </main>
        );
    }

    const aberto = pedido.status === "aberto";

    return (
        <main>
            <p>
                <Link to="/pedidos">← Voltar para os pedidos</Link>
            </p>
            <h1>Pedido nº {pedido.id}</h1>

            <section className="cartao-pedido">
                <dl>
                    <div>
                        <dt>Status</dt>
                        <dd>
                            <EtiquetaStatus status={pedido.status} />
                        </dd>
                    </div>
                    <div>
                        <dt>Cliente</dt>
                        <dd>{pedido.cliente ?? "—"}</dd>
                    </div>
                    <div>
                        <dt>Atendente</dt>
                        <dd>{pedido.atendente}</dd>
                    </div>
                    <div>
                        <dt>Aberto em</dt>
                        <dd>{formatarDataHora(pedido.dataHora)}</dd>
                    </div>
                    <div>
                        <dt>Total</dt>
                        <dd>{formatarMoeda(pedido.total)}</dd>
                    </div>
                </dl>

                {aberto && acaoPendente === null && (
                    <div className="acoes-pedido">
                        <button
                            type="button"
                            className="botao-pequeno"
                            disabled={pedido.quantidadeItens === 0}
                            onClick={() => setAcaoPendente("pago")}
                        >
                            Marcar como pago
                        </button>
                        <button type="button" className="botao-pequeno botao-perigo" onClick={() => setAcaoPendente("cancelado")}>
                            Cancelar pedido
                        </button>
                        {pedido.quantidadeItens === 0 && (
                            <span className="campo-ajuda">Adicione pelo menos um item para poder marcar como pago.</span>
                        )}
                    </div>
                )}

                {/* Pagar e cancelar são definitivos: pede confirmação antes */}
                {aberto && acaoPendente !== null && (
                    <div className="acoes-pedido" role="alert">
                        <span>
                            {acaoPendente === "pago"
                                ? "Marcar este pedido como pago? Depois disso ele não poderá mais ser alterado."
                                : "Cancelar este pedido? Depois disso ele não poderá mais ser alterado."}
                        </span>
                        <button
                            type="button"
                            className={acaoPendente === "cancelado" ? "botao-pequeno botao-perigo" : "botao-pequeno"}
                            disabled={mudando}
                            onClick={() => void mudarStatus(acaoPendente)}
                        >
                            {mudando ? "Salvando..." : "Confirmar"}
                        </button>
                        <button
                            type="button"
                            className="botao-pequeno botao-secundario"
                            disabled={mudando}
                            onClick={() => setAcaoPendente(null)}
                        >
                            Voltar
                        </button>
                    </div>
                )}
            </section>

            {aviso !== "" && (
                <p className="sucesso-api" role="status">
                    {aviso}
                </p>
            )}
            {erroAcao !== "" && (
                <p className="erro-api" role="alert">
                    {erroAcao}
                </p>
            )}

            <ListaCrud<ItemPedido>
                embutida
                titulo="Itens do pedido"
                buscarPagina={buscarItens}
                excluir={excluirItem}
                colunas={colunas}
                confirmarExclusao={(item) => `Remover "${item.produto}" do pedido?`}
                mensagemExcluido="Item removido do pedido."
                mensagemVazia="Este pedido ainda não tem itens."
                // Só pedido ABERTO aceita mudanças nos itens (regra do negócio, também garantida no back-end)
                rotaNovo={aberto ? `/pedidos/${idPedido}/itens/novo` : undefined}
                textoNovo="Adicionar item"
                rotaEditar={(item) => `/pedidos/${idPedido}/itens/${item.id}/editar`}
                podeEditar={() => aberto}
                podeExcluir={() => aberto}
                aoMudar={() => setRecarga((n) => n + 1)}
            />
        </main>
    );
}
