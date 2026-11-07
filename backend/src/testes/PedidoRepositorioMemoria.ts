import type { Pedido } from "../entidades/Pedido";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { IPedidoRepositorio, PedidoRegistro } from "../repositorios/IPedidoRepositorio";
import type { IUsuarioRepositorio } from "../repositorios/IUsuarioRepositorio";
import type { Pagina } from "../tipos/Pagina";
import type { ItemPedidoRepositorioMemoria } from "./ItemPedidoRepositorioMemoria";

// "2026-11-07 15:30:00" (a mesma forma que o banco devolve a data/hora)
function agoraTexto(): string {
    const d = new Date();
    const dois = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())} ${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
}

// Repositório "de mentira" que guarda os pedidos na memória (só pros testes).
// Imita o banco: o total e a quantidade de itens são calculados olhando os itens, a lista vem com os
// pedidos mais recentes primeiro e apagar o pedido apaga os itens dele.
export class PedidoRepositorioMemoria implements IPedidoRepositorio {
    private registros = new Map<number, Omit<PedidoRegistro, "atendente" | "quantidadeItens" | "total">>();
    private proximoId = 1;
    private itens: ItemPedidoRepositorioMemoria;
    private usuarios: Pick<IUsuarioRepositorio, "buscarPorId">;

    constructor(itens: ItemPedidoRepositorioMemoria, usuarios: Pick<IUsuarioRepositorio, "buscarPorId">) {
        this.itens = itens;
        this.usuarios = usuarios;
    }

    // Monta o registro completo (nome do atendente, quantidade de itens e total)
    private async completar(registro: Omit<PedidoRegistro, "atendente" | "quantidadeItens" | "total">): Promise<PedidoRegistro> {
        const usuario = await this.usuarios.buscarPorId(registro.idUsuario);
        const itensDoPedido = this.itens.doPedido(registro.id);
        const total = itensDoPedido.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0);
        return {
            ...registro,
            atendente: usuario?.nome ?? "",
            quantidadeItens: itensDoPedido.length,
            total: Math.round(total * 100) / 100,
        };
    }

    async inserir(pedido: Pedido): Promise<PedidoRegistro> {
        if ((await this.usuarios.buscarPorId(pedido.idUsuario)) === null) {
            throw new ErroValidacao("O usuário informado não existe.");
        }
        const registro = {
            id: this.proximoId++,
            idUsuario: pedido.idUsuario,
            cliente: pedido.cliente,
            status: pedido.status,
            dataHora: agoraTexto(),
        };
        this.registros.set(registro.id, registro);
        return this.completar(registro);
    }

    // Mais recentes primeiro (como o ORDER BY do banco)
    async listar(pagina: number, limite: number): Promise<Pagina<PedidoRegistro>> {
        const todos = [...this.registros.values()].reverse();
        const itens = await Promise.all(todos.slice((pagina - 1) * limite, pagina * limite).map((r) => this.completar(r)));
        return { itens, pagina, limite, total: todos.length, totalPaginas: Math.ceil(todos.length / limite) };
    }

    async buscarPorId(id: number): Promise<PedidoRegistro | null> {
        const registro = this.registros.get(id);
        return registro ? this.completar(registro) : null;
    }

    // Só cliente e status mudam (o dono e a data/hora ficam como estavam)
    async atualizar(id: number, pedido: Pedido): Promise<PedidoRegistro | null> {
        const atual = this.registros.get(id);
        if (!atual) return null;
        const registro = { ...atual, cliente: pedido.cliente, status: pedido.status };
        this.registros.set(id, registro);
        return this.completar(registro);
    }

    async excluir(id: number): Promise<boolean> {
        this.itens.removerDoPedido(id); // ON DELETE CASCADE
        return this.registros.delete(id);
    }

    // ---- Só pros testes e pros outros repositórios de mentira ----

    todos(): Promise<PedidoRegistro[]> {
        return Promise.all([...this.registros.values()].map((r) => this.completar(r)));
    }
}
