import ListaCrud from "../../components/crud/ListaCrud";
import type { ColunaLista } from "../../components/crud/ListaCrud";
import { clienteCategorias } from "../../servicos/recursos";
import type { Categoria } from "../../servicos/recursos";

// Estas funções ficam FORA do componente de propósito: assim são sempre as mesmas
// e a lista não busca os dados de novo a cada renderização.
function buscarPagina(pagina: number, limite: number) {
    return clienteCategorias.listar(pagina, limite);
}

function excluir(id: number) {
    return clienteCategorias.excluir(id);
}

const colunas: ColunaLista<Categoria>[] = [
    { titulo: "Nome", renderizar: (categoria) => categoria.nome },
    { titulo: "Descrição", renderizar: (categoria) => categoria.descricao ?? "—" },
];

// Tela de listagem de categorias (a tabela, os botões e a paginação vêm do ListaCrud genérico)
export default function ListaCategorias() {
    return (
        <ListaCrud<Categoria>
            titulo="Categorias"
            buscarPagina={buscarPagina}
            excluir={excluir}
            colunas={colunas}
            confirmarExclusao={(categoria) => `Excluir a categoria "${categoria.nome}"?`}
            mensagemExcluido="Categoria excluída com sucesso."
            mensagemVazia="Nenhuma categoria cadastrada ainda."
            rotaNovo="/categorias/novo"
            textoNovo="Nova categoria"
            rotaEditar={(categoria) => `/categorias/${categoria.id}/editar`}
        />
    );
}
