import { Pedido } from "../entidades/Pedido";
import { ErroConflito } from "../erros/ErroConflito";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { PedidoRegistro } from "../repositorios/IPedidoRepositorio";
import { ServicoCrudBase } from "./ServicoCrudBase";

// Formato dos dados que chegam do front-end (criar e editar usam o mesmo)
export interface DadosPedido {
    idUsuario: number; // quem está logado (vem do token, nunca do corpo da requisição)
    cliente: string | null; // opcional
    status: string; // "aberto", "pago" ou "cancelado" (quem confere é a entidade Pedido)
}

// Classe FILHA: criar, listar, buscar, atualizar e excluir já vêm da base.
// Aqui ficam as regras do ciclo de vida do pedido: aberto -> pago ou cancelado (e aí fecha).
export class PedidoServico extends ServicoCrudBase<DadosPedido, Pedido, PedidoRegistro> {
    protected readonly mensagemNaoEncontrado = "Pedido não encontrado.";

    // Cria o Pedido: é ELE que valida cliente e status
    protected criarEntidade(dados: DadosPedido): Pedido {
        return new Pedido(dados.idUsuario, dados.cliente, dados.status);
    }

    protected override async verificarRegras(pedido: Pedido, id: number | null): Promise<void> {
        // CRIAR: todo pedido nasce aberto (senão dava pra criar um pedido "pago" sem nenhum item)
        if (id === null) {
            if (pedido.status !== "aberto") {
                throw new ErroValidacao("Todo pedido começa aberto: depois de adicionar os itens, marque como pago.");
            }
            return;
        }

        // EDITAR: olha como o pedido está hoje no banco
        const atual = await this.repositorio.buscarPorId(id);
        if (atual === null) return; // não existe: a base responde 404

        // Pedido pago ou cancelado já está fechado: não muda mais
        if (atual.status !== "aberto") {
            throw new ErroConflito("Este pedido já foi finalizado (pago ou cancelado) e não pode mais ser alterado.");
        }
        // Pagar um pedido vazio não faz sentido
        if (pedido.status === "pago" && atual.quantidadeItens === 0) {
            throw new ErroConflito("Adicione pelo menos um item antes de marcar o pedido como pago.");
        }
    }

    // Pedido pago entra no faturamento: não pode ser apagado
    protected override async verificarExclusao(id: number): Promise<void> {
        const atual = await this.repositorio.buscarPorId(id);
        if (atual !== null && atual.status === "pago") {
            throw new ErroConflito("Um pedido pago não pode ser excluído (ele faz parte do faturamento).");
        }
    }
}
