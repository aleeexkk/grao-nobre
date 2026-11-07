import { pool } from "../config/conexao";
import type { ItemPedido } from "../entidades/ItemPedido";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { IItemPedidoRepositorio, ItemPedidoRegistro } from "./IItemPedidoRepositorio";
import { RepositorioMySqlBase } from "./RepositorioMySqlBase";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Uma linha do resultado, do jeito que o banco devolve
interface LinhaItemPedido extends RowDataPacket {
    id_item: number;
    id_pedido: number;
    id_produto: number;
    nome_produto: string;
    quantidade: number;
    preco_unitario: string; // DECIMAL chega como TEXTO, por isso convertemos abaixo
    subtotal: string;
}

// Classe FILHA: herda listar, buscarPorId e excluir da base e escreve só o que é do item
export class ItemPedidoRepositorio
    extends RepositorioMySqlBase<ItemPedido, ItemPedidoRegistro, LinhaItemPedido>
    implements IItemPedidoRepositorio
{
    protected readonly tabela = "item_pedido";
    protected readonly colunaId = "id_item";
    protected readonly colunas =
        "i.id_item, i.id_pedido, i.id_produto, p.nome AS nome_produto, i.quantidade, i.preco_unitario, (i.quantidade * i.preco_unitario) AS subtotal";

    // JOIN: junta cada item com o seu produto (pra mostrar o nome na tela)
    protected override get origem(): string {
        return "item_pedido i INNER JOIN produto p ON p.id_produto = i.id_produto";
    }

    // Esta listagem aceita ?idPedido=5 (só os itens daquele pedido)
    protected override get filtrosAceitos(): Readonly<Record<string, string>> {
        return { idPedido: "i.id_pedido" };
    }

    protected paraRegistro(linha: LinhaItemPedido): ItemPedidoRegistro {
        return {
            id: linha.id_item,
            idPedido: linha.id_pedido,
            idProduto: linha.id_produto,
            produto: linha.nome_produto,
            quantidade: linha.quantidade,
            precoUnitario: Number(linha.preco_unitario),
            subtotal: Number(linha.subtotal),
        };
    }

    // Salva o item. O PREÇO é copiado do produto pelo próprio banco, no mesmo comando (INSERT ... SELECT):
    // nada de ler o preço, voltar pro Node e gravar (outro pedido poderia mudar o preço no meio do caminho).
    async inserir(item: ItemPedido): Promise<ItemPedidoRegistro> {
        let id: number;
        try {
            const [resultado] = await pool.execute<ResultSetHeader>(
                `INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario)
                 SELECT ?, p.id_produto, ?, p.preco FROM produto p WHERE p.id_produto = ?`,
                [item.idPedido, item.quantidade, item.idProduto]
            );
            // Se o produto não existe, o SELECT não devolve nenhuma linha e nada é inserido
            if (resultado.affectedRows === 0) {
                throw new ErroValidacao("O produto informado não existe.");
            }
            id = resultado.insertId;
        } catch (erro) {
            // Pedido que não existe (a chave estrangeira barrou)
            if (this.temCodigo(erro, "ER_NO_REFERENCED_ROW_2")) {
                throw new ErroValidacao("O pedido informado não existe.");
            }
            // O mesmo produto duas vezes no mesmo pedido (a chave única barrou)
            return this.traduzirErro(
                erro,
                "Esse produto já está no pedido. Edite a quantidade do item que já existe."
            );
        }

        const criado = await this.buscarPorId(id);
        if (criado === null) {
            throw new Error("Item não encontrado logo depois de salvar."); // não deveria acontecer
        }
        return criado;
    }

    // Altera só a QUANTIDADE (o serviço já garantiu que pedido e produto continuam os mesmos).
    // Devolve o item atualizado, ou null se o id não existir
    async atualizar(id: number, item: ItemPedido): Promise<ItemPedidoRegistro | null> {
        await pool.execute<ResultSetHeader>(
            "UPDATE item_pedido SET quantidade = ? WHERE id_item = ?",
            [item.quantidade, id]
        );
        return this.buscarPorId(id);
    }
}
