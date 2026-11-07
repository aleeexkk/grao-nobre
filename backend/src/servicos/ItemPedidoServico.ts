import { ItemPedido } from "../entidades/ItemPedido";
import { ErroConflito } from "../erros/ErroConflito";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { IItemPedidoRepositorio, ItemPedidoRegistro } from "../repositorios/IItemPedidoRepositorio";
import type { IPedidoRepositorio } from "../repositorios/IPedidoRepositorio";
import type { IProdutoRepositorio } from "../repositorios/IProdutoRepositorio";
import { ServicoCrudBase } from "./ServicoCrudBase";

// Formato dos dados que chegam do front-end (criar e editar usam o mesmo)
export interface DadosItemPedido {
    idPedido: number;
    idProduto: number;
    quantidade: number;
}

const MENSAGEM_PEDIDO_FECHADO = "Este pedido já foi finalizado (pago ou cancelado): não dá mais pra mexer nos itens.";

// Classe FILHA: criar, listar, buscar, atualizar e excluir já vêm da base.
// Aqui ficam as regras do item: o pedido e o produto precisam existir e o pedido precisa estar aberto.
export class ItemPedidoServico extends ServicoCrudBase<DadosItemPedido, ItemPedido, ItemPedidoRegistro> {
    protected readonly mensagemNaoEncontrado = "Item não encontrado.";

    // Pedimos SÓ o que vamos usar (buscarPorId), e não os contratos inteiros (segregação de interfaces)
    private pedidos: Pick<IPedidoRepositorio, "buscarPorId">;
    private produtos: Pick<IProdutoRepositorio, "buscarPorId">;

    constructor(
        repositorio: IItemPedidoRepositorio,
        pedidos: Pick<IPedidoRepositorio, "buscarPorId">,
        produtos: Pick<IProdutoRepositorio, "buscarPorId">
    ) {
        super(repositorio); // entrega o repositório de itens pra classe base
        this.pedidos = pedidos;
        this.produtos = produtos;
    }

    // Cria o ItemPedido: é ELE que valida os ids e a quantidade
    protected criarEntidade(dados: DadosItemPedido): ItemPedido {
        return new ItemPedido(dados.idPedido, dados.idProduto, dados.quantidade);
    }

    protected override async verificarRegras(item: ItemPedido, id: number | null): Promise<void> {
        if (id !== null) {
            // EDITAR: só a quantidade pode mudar. Pra trocar o produto, apaga o item e cria outro
            const atual = await this.repositorio.buscarPorId(id);
            if (atual === null) return; // não existe: a base responde 404
            if (atual.idPedido !== item.idPedido || atual.idProduto !== item.idProduto) {
                throw new ErroValidacao(
                    "Não é possível trocar o pedido nem o produto de um item. Exclua o item e adicione outro."
                );
            }
        } else if ((await this.produtos.buscarPorId(item.idProduto)) === null) {
            throw new ErroValidacao("O produto informado não existe.");
        }

        const pedido = await this.pedidos.buscarPorId(item.idPedido);
        if (pedido === null) {
            throw new ErroValidacao("O pedido informado não existe.");
        }
        if (pedido.status !== "aberto") {
            throw new ErroConflito(MENSAGEM_PEDIDO_FECHADO);
        }
    }

    // Apagar um item também só vale em pedido aberto
    protected override async verificarExclusao(id: number): Promise<void> {
        const atual = await this.repositorio.buscarPorId(id);
        if (atual === null) return; // não existe: a base responde 404

        const pedido = await this.pedidos.buscarPorId(atual.idPedido);
        if (pedido !== null && pedido.status !== "aberto") {
            throw new ErroConflito(MENSAGEM_PEDIDO_FECHADO);
        }
    }
}
