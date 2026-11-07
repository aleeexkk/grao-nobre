import { pool } from "../config/conexao";
import type { IEstatisticaRepositorio, VendaRegistro } from "./IEstatisticaRepositorio";
import type { RowDataPacket } from "mysql2/promise";

interface LinhaVenda extends RowDataPacket {
    id_item: number;
    id_pedido: number;
    data: string;
    hora: number;
    produto: string;
    categoria: string;
    quantidade: number;
    preco_unitario: string; // DECIMAL chega como TEXTO
}

// Lê do banco as vendas reais (itens de pedidos PAGOS) pra alimentar o painel de estatísticas
export class EstatisticaRepositorio implements IEstatisticaRepositorio {
    async listarVendas(dias: number): Promise<VendaRegistro[]> {
        // Junta 4 tabelas: item -> pedido (data e status) -> produto (nome e preço) -> categoria (nome).
        // Só entram pedidos PAGOS (aberto e cancelado não são faturamento).
        // "dias" já foi conferido como inteiro de 1 a 365 e entra pelo "?".
        const [linhas] = await pool.query<LinhaVenda[]>(
            `SELECT i.id_item, p.id_pedido,
                    DATE_FORMAT(p.data_hora, '%Y-%m-%d') AS data,
                    HOUR(p.data_hora) AS hora,
                    pr.nome AS produto, c.nome AS categoria,
                    i.quantidade, i.preco_unitario
               FROM item_pedido i
              INNER JOIN pedido p ON p.id_pedido = i.id_pedido
              INNER JOIN produto pr ON pr.id_produto = i.id_produto
              INNER JOIN categoria c ON c.id_categoria = pr.id_categoria
              WHERE p.status = 'pago'
                AND p.data_hora >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              ORDER BY p.data_hora, i.id_item`,
            [dias]
        );

        return linhas.map((linha) => ({
            id: linha.id_item,
            idPedido: linha.id_pedido,
            data: linha.data,
            hora: Number(linha.hora),
            produto: linha.produto,
            categoria: linha.categoria,
            quantidade: linha.quantidade,
            valorUnitario: Number(linha.preco_unitario), // texto "6.00" -> número 6
        }));
    }
}
