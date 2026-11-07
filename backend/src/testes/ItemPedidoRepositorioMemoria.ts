import type { ItemPedido } from "../entidades/ItemPedido";
import { ErroConflito } from "../erros/ErroConflito";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { IItemPedidoRepositorio, ItemPedidoRegistro } from "../repositorios/IItemPedidoRepositorio";
import type { IProdutoRepositorio } from "../repositorios/IProdutoRepositorio";
import type { Filtros } from "../tipos/Filtros";
import type { Pagina } from "../tipos/Pagina";

// Dinheiro sem sobra de arredondamento: 3 x 4,10 = 12,3 (e não 12,299999...)
function arredondar(valor: number): number {
    return Math.round(valor * 100) / 100;
}

// Repositório "de mentira" que guarda os itens na memória (só pros testes).
// Imita o banco: copia o preço do produto na hora de inserir (INSERT ... SELECT) e
// não aceita o mesmo produto duas vezes no mesmo pedido (chave única).
export class ItemPedidoRepositorioMemoria implements IItemPedidoRepositorio {
    private registros = new Map<number, Omit<ItemPedidoRegistro, "produto" | "subtotal">>();
    private proximoId = 1;
    private produtos: Pick<IProdutoRepositorio, "buscarPorId">;

    constructor(produtos: Pick<IProdutoRepositorio, "buscarPorId">) {
        this.produtos = produtos;
    }

    // Monta o registro completo: nome do produto (o "JOIN" de mentira) e subtotal
    private async completar(registro: Omit<ItemPedidoRegistro, "produto" | "subtotal">): Promise<ItemPedidoRegistro> {
        const produto = await this.produtos.buscarPorId(registro.idProduto);
        return {
            ...registro,
            produto: produto?.nome ?? "",
            subtotal: arredondar(registro.quantidade * registro.precoUnitario),
        };
    }

    async inserir(item: ItemPedido): Promise<ItemPedidoRegistro> {
        const produto = await this.produtos.buscarPorId(item.idProduto);
        if (produto === null) {
            throw new ErroValidacao("O produto informado não existe.");
        }
        const repetido = [...this.registros.values()].some(
            (r) => r.idPedido === item.idPedido && r.idProduto === item.idProduto
        );
        if (repetido) {
            throw new ErroConflito("Esse produto já está no pedido. Edite a quantidade do item que já existe.");
        }

        const registro = {
            id: this.proximoId++,
            idPedido: item.idPedido,
            idProduto: item.idProduto,
            quantidade: item.quantidade,
            precoUnitario: produto.preco, // o preço é "congelado" aqui
        };
        this.registros.set(registro.id, registro);
        return this.completar(registro);
    }

    async listar(pagina: number, limite: number, filtros: Filtros = {}): Promise<Pagina<ItemPedidoRegistro>> {
        let todos = [...this.registros.values()];
        if (filtros.idPedido !== undefined) {
            todos = todos.filter((r) => r.idPedido === filtros.idPedido);
        }
        const itens = await Promise.all(todos.slice((pagina - 1) * limite, pagina * limite).map((r) => this.completar(r)));
        return { itens, pagina, limite, total: todos.length, totalPaginas: Math.ceil(todos.length / limite) };
    }

    async buscarPorId(id: number): Promise<ItemPedidoRegistro | null> {
        const registro = this.registros.get(id);
        return registro ? this.completar(registro) : null;
    }

    // Só a quantidade muda (como no banco de verdade)
    async atualizar(id: number, item: ItemPedido): Promise<ItemPedidoRegistro | null> {
        const atual = this.registros.get(id);
        if (!atual) return null;
        const registro = { ...atual, quantidade: item.quantidade };
        this.registros.set(id, registro);
        return this.completar(registro);
    }

    async excluir(id: number): Promise<boolean> {
        return this.registros.delete(id);
    }

    // ---- Só pros testes e pros outros repositórios de mentira ----

    // Itens de um pedido (o pedido de mentira usa isso pra calcular quantidade e total)
    doPedido(idPedido: number): ReadonlyArray<Omit<ItemPedidoRegistro, "produto" | "subtotal">> {
        return [...this.registros.values()].filter((r) => r.idPedido === idPedido);
    }

    // Imita o "ON DELETE CASCADE": apagou o pedido, apagam-se os itens dele
    removerDoPedido(idPedido: number): void {
        for (const [id, registro] of this.registros) {
            if (registro.idPedido === idPedido) this.registros.delete(id);
        }
    }
}
