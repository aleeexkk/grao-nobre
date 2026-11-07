import { validarIdPositivo, validarOpcao, validarTextoOpcional } from "../validadores/validadores";

// Os 3 estados possíveis de um pedido. "as const" trava a lista (ninguém acrescenta um quarto por engano)
// e o tipo StatusPedido nasce dela: "aberto" | "pago" | "cancelado" (a lista e o tipo nunca ficam diferentes)
export const STATUS_PEDIDO = ["aberto", "pago", "cancelado"] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

// Classe que representa o "cabeçalho" de um pedido (quem pediu e em que situação está).
// Os produtos do pedido ficam nos ITENS (classe ItemPedido). A data/hora é o banco que preenche.
export class Pedido {
    // "private" = só a própria classe mexe nesses campos (encapsulamento)
    private _id: number | null; // null enquanto o pedido ainda não foi salvo no banco
    private _idUsuario: number; // quem registrou o pedido (o funcionário logado)
    private _cliente: string | null; // nome do cliente (opcional: no balcão nem sempre pedem)
    private _status: StatusPedido;

    // Construtor: valida ANTES de guardar (não nasce pedido inválido)
    constructor(idUsuario: number, cliente: string | null, status: string = "aberto", id: number | null = null) {
        this._id = id;
        this._idUsuario = validarIdPositivo(idUsuario, "Usuário inválido.");
        this._cliente = validarTextoOpcional(cliente, "Cliente", 100);
        this._status = validarOpcao(status, STATUS_PEDIDO, "Status inválido: use aberto, pago ou cancelado.");
    }

    // id e idUsuario: só leitura (o banco define o id e o dono do pedido não muda)
    get id(): number | null {
        return this._id;
    }

    get idUsuario(): number {
        return this._idUsuario;
    }

    get cliente(): string | null {
        return this._cliente;
    }
    set cliente(valor: string | null) {
        this._cliente = validarTextoOpcional(valor, "Cliente", 100);
    }

    get status(): StatusPedido {
        return this._status;
    }
    set status(valor: string) {
        this._status = validarOpcao(valor, STATUS_PEDIDO, "Status inválido: use aberto, pago ou cancelado.");
    }
}
