import { useParams } from "react-router-dom";
import PaginaFormCrud from "../../components/crud/PaginaFormCrud";
import type { CampoFormulario } from "../../components/crud/FormularioCrud";
import { clientePedidos } from "../../servicos/recursos";
import type { DadosPedido, Pedido, StatusPedido } from "../../servicos/recursos";
import { lerIdDaRota } from "../../utils/numeros";
import { validarTamanho } from "../../validadores/validadores";

type ValoresPedido = { cliente: string; status: string };

const VAZIO: ValoresPedido = { cliente: "", status: "aberto" };

// Converte o texto da caixa de seleção no tipo certo (qualquer outra coisa vira "aberto")
function lerStatus(texto: string): StatusPedido {
    if (texto === "pago" || texto === "cancelado") return texto;
    return "aberto";
}

function paraFormulario(pedido: Pedido): ValoresPedido {
    return { cliente: pedido.cliente ?? "", status: pedido.status };
}

function paraDados(valores: ValoresPedido): DadosPedido {
    const cliente = valores.cliente.trim();
    return { cliente: cliente === "" ? null : cliente, status: lerStatus(valores.status) };
}

// Serve para abrir um pedido (/pedidos/novo) e editar (/pedidos/:id/editar)
export default function FormPedido() {
    const { id } = useParams();
    const idRegistro = lerIdDaRota(id);

    const campos: CampoFormulario<ValoresPedido>[] = [
        {
            nome: "cliente",
            rotulo: "Cliente",
            tipo: "texto",
            ajuda: "Opcional. Nome de quem fez o pedido (até 100 caracteres).",
            validar: (valor) => validarTamanho(valor, "O nome do cliente", 0, 100),
        },
    ];

    // O status só aparece na edição: todo pedido novo nasce "aberto"
    if (idRegistro !== null) {
        campos.push({
            nome: "status",
            rotulo: "Status",
            tipo: "selecao",
            obrigatorio: true,
            opcoes: [
                { valor: "aberto", rotulo: "Aberto" },
                { valor: "pago", rotulo: "Pago" },
                { valor: "cancelado", rotulo: "Cancelado" },
            ],
            ajuda: "Pago e cancelado são definitivos: depois disso o pedido não pode mais ser alterado.",
        });
    }

    return (
        <PaginaFormCrud<Pedido, DadosPedido, ValoresPedido>
            cliente={clientePedidos}
            idRegistro={idRegistro}
            tituloNovo="Novo pedido"
            tituloEditar="Editar pedido"
            campos={campos}
            valoresVazios={VAZIO}
            paraFormulario={paraFormulario}
            paraDados={paraDados}
            rotaLista="/pedidos"
            // Depois de abrir o pedido, já vai pra tela de adicionar os itens
            rotaAposCriar={(pedido) => `/pedidos/${pedido.id}/itens`}
            mensagemCriado="Pedido aberto. Agora adicione os itens."
            mensagemAtualizado="Pedido atualizado com sucesso."
        />
    );
}
