import ListaCrud from "../../components/crud/ListaCrud";
import type { ColunaLista } from "../../components/crud/ListaCrud";
import { clienteProdutos } from "../../servicos/recursos";
import type { Produto } from "../../servicos/recursos";
import { formatarMoeda } from "../../utils/formatacao";

function buscarPagina(pagina: number, limite: number) {
    return clienteProdutos.listar(pagina, limite);
}

function excluir(id: number) {
    return clienteProdutos.excluir(id);
}

const colunas: ColunaLista<Produto>[] = [
    { titulo: "Nome", renderizar: (produto) => produto.nome },
    { titulo: "Categoria", renderizar: (produto) => produto.categoria },
    { titulo: "Preço", classe: "numero", renderizar: (produto) => formatarMoeda(produto.preco) },
    { titulo: "Descrição", renderizar: (produto) => produto.descricao ?? "—" },
];

// Tela de listagem de produtos
export default function ListaProdutos() {
    return (
        <ListaCrud<Produto>
            titulo="Produtos"
            buscarPagina={buscarPagina}
            excluir={excluir}
            colunas={colunas}
            confirmarExclusao={(produto) => `Excluir o produto "${produto.nome}"?`}
            mensagemExcluido="Produto excluído com sucesso."
            mensagemVazia="Nenhum produto cadastrado ainda."
            rotaNovo="/produtos/novo"
            textoNovo="Novo produto"
            rotaEditar={(produto) => `/produtos/${produto.id}/editar`}
        />
    );
}
