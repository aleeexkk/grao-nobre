import { pool } from "../config/conexao";
import type { Pedido, StatusPedido } from "../entidades/Pedido";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { IPedidoRepositorio, PedidoRegistro } from "./IPedidoRepositorio";
import { RepositorioMySqlBase } from "./RepositorioMySqlBase";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Uma linha do resultado, do jeito que o banco devolve
interface LinhaPedido extends RowDataPacket {
    id_pedido: number;
    id_usuario: number;
    nome_usuario: string;
    cliente: string | null;
    status: StatusPedido;
    data_hora: string; // já formatada pelo próprio SQL (DATE_FORMAT), pra não depender de fuso horário
    quantidade_itens: number;
    total: string; // DECIMAL chega como TEXTO ("25.50"), por isso convertemos abaixo
}

// Classe FILHA: herda listar, buscarPorId e excluir da base e escreve só o que é do pedido
export class PedidoRepositorio
    extends RepositorioMySqlBase<Pedido, PedidoRegistro, LinhaPedido>
    implements IPedidoRepositorio
{
    protected readonly tabela = "pedido";
    protected readonly colunaId = "id_pedido";

    // Além das colunas do pedido, o SELECT calcula na hora a quantidade de itens e o total
    // (sub-consultas que olham os itens do pedido). Assim o total NUNCA fica desatualizado.
    protected readonly colunas = `
        p.id_pedido, p.id_usuario, u.nome AS nome_usuario, p.cliente, p.status,
        DATE_FORMAT(p.data_hora, '%Y-%m-%d %H:%i:%s') AS data_hora,
        (SELECT COUNT(*) FROM item_pedido i WHERE i.id_pedido = p.id_pedido) AS quantidade_itens,
        (SELECT COALESCE(SUM(i.quantidade * i.preco_unitario), 0) FROM item_pedido i WHERE i.id_pedido = p.id_pedido) AS total
    `;

    // JOIN: junta cada pedido com o usuário que o registrou (pra mostrar o nome do atendente)
    protected override get origem(): string {
        return "pedido p INNER JOIN usuario u ON u.id_usuario = p.id_usuario";
    }

    // Pedidos mais recentes primeiro (é o que o dono da cafeteria quer ver)
    protected override get ordenacao(): string {
        return "p.data_hora DESC, p.id_pedido DESC";
    }

    protected paraRegistro(linha: LinhaPedido): PedidoRegistro {
        return {
            id: linha.id_pedido,
            idUsuario: linha.id_usuario,
            atendente: linha.nome_usuario,
            cliente: linha.cliente,
            status: linha.status,
            dataHora: linha.data_hora,
            quantidadeItens: Number(linha.quantidade_itens),
            total: Number(linha.total), // texto "25.50" -> número 25.5
        };
    }

    // Salva um pedido novo (a data/hora o banco preenche sozinho) e devolve ele completo
    async inserir(pedido: Pedido): Promise<PedidoRegistro> {
        let id: number;
        try {
            const [resultado] = await pool.execute<ResultSetHeader>(
                "INSERT INTO pedido (id_usuario, cliente, status) VALUES (?, ?, ?)",
                [pedido.idUsuario, pedido.cliente, pedido.status]
            );
            id = resultado.insertId;
        } catch (erro) {
            // Usuário que não existe mais (a chave estrangeira barrou)
            if (this.temCodigo(erro, "ER_NO_REFERENCED_ROW_2")) {
                throw new ErroValidacao("O usuário informado não existe.");
            }
            throw erro;
        }

        const criado = await this.buscarPorId(id);
        if (criado === null) {
            throw new Error("Pedido não encontrado logo depois de salvar."); // não deveria acontecer
        }
        return criado;
    }

    // Altera cliente e status. O dono (id_usuario) e a data/hora NÃO mudam.
    // Devolve o pedido atualizado, ou null se o id não existir
    async atualizar(id: number, pedido: Pedido): Promise<PedidoRegistro | null> {
        await pool.execute<ResultSetHeader>(
            "UPDATE pedido SET cliente = ?, status = ? WHERE id_pedido = ?",
            [pedido.cliente, pedido.status, id]
        );
        return this.buscarPorId(id);
    }
}
