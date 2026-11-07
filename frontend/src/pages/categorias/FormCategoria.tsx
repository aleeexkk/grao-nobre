import { useParams } from "react-router-dom";
import PaginaFormCrud from "../../components/crud/PaginaFormCrud";
import type { CampoFormulario } from "../../components/crud/FormularioCrud";
import { clienteCategorias } from "../../servicos/recursos";
import type { Categoria, DadosCategoria } from "../../servicos/recursos";
import { lerIdDaRota } from "../../utils/numeros";
import { validarTamanho } from "../../validadores/validadores";

// Tudo no formulário é texto (o que a pessoa digita); depois convertemos pro formato da API
type ValoresCategoria = { nome: string; descricao: string };

const VAZIO: ValoresCategoria = { nome: "", descricao: "" };

const campos: CampoFormulario<ValoresCategoria>[] = [
    {
        nome: "nome",
        rotulo: "Nome",
        tipo: "texto",
        obrigatorio: true,
        validar: (valor) => validarTamanho(valor, "O nome", 2, 60),
    },
    {
        nome: "descricao",
        rotulo: "Descrição",
        tipo: "texto",
        ajuda: "Opcional. Até 200 caracteres.",
        validar: (valor) => validarTamanho(valor, "A descrição", 0, 200),
    },
];

function paraFormulario(categoria: Categoria): ValoresCategoria {
    return { nome: categoria.nome, descricao: categoria.descricao ?? "" };
}

// Descrição vazia vira null (o banco guarda "sem descrição" como NULL)
function paraDados(valores: ValoresCategoria): DadosCategoria {
    const descricao = valores.descricao.trim();
    return { nome: valores.nome.trim(), descricao: descricao === "" ? null : descricao };
}

// Serve para cadastrar (/categorias/novo) e editar (/categorias/:id/editar)
export default function FormCategoria() {
    const { id } = useParams();

    return (
        <PaginaFormCrud<Categoria, DadosCategoria, ValoresCategoria>
            cliente={clienteCategorias}
            idRegistro={lerIdDaRota(id)}
            tituloNovo="Nova categoria"
            tituloEditar="Editar categoria"
            campos={campos}
            valoresVazios={VAZIO}
            paraFormulario={paraFormulario}
            paraDados={paraDados}
            rotaLista="/categorias"
            mensagemCriado="Categoria cadastrada com sucesso."
            mensagemAtualizado="Categoria atualizada com sucesso."
        />
    );
}
