import type { IEstatisticaRepositorio, VendaRegistro } from "../repositorios/IEstatisticaRepositorio";
import type { IProdutoRepositorio } from "../repositorios/IProdutoRepositorio";
import type { ItemPedidoRepositorioMemoria } from "./ItemPedidoRepositorioMemoria";
import type { PedidoRepositorioMemoria } from "./PedidoRepositorioMemoria";

// Repositório "de mentira" das estatísticas: monta as vendas olhando os pedidos PAGOS,
// os itens e os produtos que estão na memória (o mesmo que o SQL com JOIN faz no banco).
export class EstatisticaRepositorioMemoria implements IEstatisticaRepositorio {
    private pedidos: PedidoRepositorioMemoria;
    private itens: ItemPedidoRepositorioMemoria;
    private produtos: Pick<IProdutoRepositorio, "buscarPorId">;

    constructor(
        pedidos: PedidoRepositorioMemoria,
        itens: ItemPedidoRepositorioMemoria,
        produtos: Pick<IProdutoRepositorio, "buscarPorId">
    ) {
        this.pedidos = pedidos;
        this.itens = itens;
        this.produtos = produtos;
    }

    async listarVendas(_dias: number): Promise<VendaRegistro[]> {
        const vendas: VendaRegistro[] = [];

        for (const pedido of await this.pedidos.todos()) {
            if (pedido.status !== "pago") continue; // só pedido pago é faturamento

            for (const item of this.itens.doPedido(pedido.id)) {
                const produto = await this.produtos.buscarPorId(item.idProduto);
                vendas.push({
                    id: item.id,
                    idPedido: pedido.id,
                    data: pedido.dataHora.slice(0, 10), // "2026-11-07"
                    hora: Number(pedido.dataHora.slice(11, 13)), // "15"
                    produto: produto?.nome ?? "",
                    categoria: produto?.categoria ?? "",
                    quantidade: item.quantidade,
                    valorUnitario: item.precoUnitario,
                });
            }
        }
        return vendas;
    }
}
