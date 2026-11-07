import { Link, useParams } from "react-router-dom";
import PaginaFormCrud from "../../components/crud/PaginaFormCrud";
import type { CampoFormulario } from "../../components/crud/FormularioCrud";
import { useDados } from "../../hooks/useDados";
import { listarTodos } from "../../servicos/crud";
import { clienteItensPedido, clienteProdutos } from "../../servicos/recursos";
import type { DadosItemPedido, ItemPedido } from "../../servicos/recursos";
import { formatarMoeda } from "../../utils/formatacao";
import { lerIdDaRota } from "../../utils/numeros";
import { validarQuantidadeTexto } from "../../validadores/validadores";

type ValoresItem = { idProduto: string; quantidade: string };

const VAZIO: ValoresItem = { idProduto: "", quantidade: "1" };

function paraFormulario(item: ItemPedido): ValoresItem {
    return { idProduto: String(item.idProduto), quantidade: String(item.quantidade) };
}

// Busca TODOS os produtos (pra montar a caixa de seleção)
function buscarProdutos() {
    return listarTodos((pagina, limite) => clienteProdutos.listar(pagina, limite));
}

// Serve para adicionar item (/pedidos/:id/itens/novo) e editar (/pedidos/:id/itens/:idItem/editar)
export default function FormItemPedido() {
    const { id, idItem } = useParams();
    const idPedido = lerIdDaRota(id) ?? 0;
    const idRegistro = lerIdDaRota(idItem);
    const rotaLista = `/pedidos/${idPedido}/itens`;

    const { dados: produtos, erro, carregando } = useDados(buscarProdutos);

    if (erro !== "") {
        return (
            <main>
                <h1>Item do pedido</h1>
                <p className="erro-api" role="alert">
                    {erro}
                </p>
                <Link to={rotaLista}>Voltar para o pedido</Link>
            </main>
        );
    }

    if (carregando || produtos === null) {
        return (
            <main>
                <p>Carregando...</p>
            </main>
        );
    }

    if (produtos.length === 0) {
        return (
            <main>
                <h1>Novo item</h1>
                <p>Antes de adicionar itens, cadastre pelo menos um produto.</p>
                <Link to="/produtos/novo">Cadastrar produto</Link>
            </main>
        );
    }

    const campos: CampoFormulario<ValoresItem>[] = [
        {
            nome: "idProduto",
            rotulo: "Produto",
            tipo: "selecao",
            obrigatorio: true,
            opcoes: produtos.map((produto) => ({
                valor: String(produto.id),
                rotulo: `${produto.nome} — ${formatarMoeda(produto.preco)}`,
            })),
            // Na edição o produto não muda: pra trocar, remove o item e adiciona outro
            desabilitado: idRegistro !== null,
            ajuda:
                idRegistro !== null
                    ? "Para trocar o produto, remova este item e adicione outro."
                    : "Cada produto aparece uma vez por pedido. Para pedir mais, edite a quantidade do item.",
        },
        {
            nome: "quantidade",
            rotulo: "Quantidade",
            tipo: "texto",
            obrigatorio: true,
            validar: (valor) => validarQuantidadeTexto(valor),
        },
    ];

    // O pedido vem da URL; produto e quantidade vêm do formulário
    function paraDados(valores: ValoresItem): DadosItemPedido {
        return {
            idPedido,
            idProduto: Number(valores.idProduto),
            quantidade: Number(valores.quantidade.trim()),
        };
    }

    return (
        <PaginaFormCrud<ItemPedido, DadosItemPedido, ValoresItem>
            cliente={clienteItensPedido}
            idRegistro={idRegistro}
            tituloNovo={`Novo item — pedido nº ${idPedido}`}
            tituloEditar={`Editar item — pedido nº ${idPedido}`}
            campos={campos}
            valoresVazios={VAZIO}
            paraFormulario={paraFormulario}
            paraDados={paraDados}
            rotaLista={rotaLista}
            mensagemCriado="Item adicionado ao pedido."
            mensagemAtualizado="Item atualizado com sucesso."
        />
    );
}
