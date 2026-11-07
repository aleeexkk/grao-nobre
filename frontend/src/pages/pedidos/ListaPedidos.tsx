import { Link } from "react-router-dom";
import EtiquetaStatus from "../../components/EtiquetaStatus";
import ListaCrud from "../../components/crud/ListaCrud";
import type { ColunaLista } from "../../components/crud/ListaCrud";
import { clientePedidos } from "../../servicos/recursos";
import type { Pedido } from "../../servicos/recursos";
import { formatarDataHora, formatarMoeda } from "../../utils/formatacao";

function buscarPagina(pagina: number, limite: number) {
    return clientePedidos.listar(pagina, limite);
}

function excluir(id: number) {
    return clientePedidos.excluir(id);
}

const colunas: ColunaLista<Pedido>[] = [
    { titulo: "Nº", renderizar: (pedido) => pedido.id },
    { titulo: "Data", renderizar: (pedido) => formatarDataHora(pedido.dataHora) },
    { titulo: "Cliente", renderizar: (pedido) => pedido.cliente ?? "—" },
    { titulo: "Atendente", renderizar: (pedido) => pedido.atendente },
    { titulo: "Itens", classe: "numero", renderizar: (pedido) => pedido.quantidadeItens },
    { titulo: "Total", classe: "numero", renderizar: (pedido) => formatarMoeda(pedido.total) },
    { titulo: "Status", renderizar: (pedido) => <EtiquetaStatus status={pedido.status} /> },
];

// Tela de listagem de pedidos (os mais recentes primeiro)
export default function ListaPedidos() {
    return (
        <ListaCrud<Pedido>
            titulo="Pedidos"
            buscarPagina={buscarPagina}
            excluir={excluir}
            colunas={colunas}
            confirmarExclusao={(pedido) => `Excluir o pedido nº ${pedido.id}? Os itens dele também serão apagados.`}
            mensagemExcluido="Pedido excluído com sucesso."
            mensagemVazia="Nenhum pedido registrado ainda."
            rotaNovo="/pedidos/novo"
            textoNovo="Novo pedido"
            rotaEditar={(pedido) => `/pedidos/${pedido.id}/editar`}
            // Regras do negócio: pedido fechado (pago/cancelado) não muda, e pedido pago não pode ser apagado
            podeEditar={(pedido) => pedido.status === "aberto"}
            podeExcluir={(pedido) => pedido.status !== "pago"}
            acoesExtras={(pedido) => (
                <Link to={`/pedidos/${pedido.id}/itens`} className="botao-pequeno">
                    Itens
                </Link>
            )}
        />
    );
}
