import { Link, useParams } from "react-router-dom";
import PaginaFormCrud from "../../components/crud/PaginaFormCrud";
import type { CampoFormulario } from "../../components/crud/FormularioCrud";
import { useDados } from "../../hooks/useDados";
import { listarTodos } from "../../servicos/crud";
import { clienteCategorias, clienteProdutos } from "../../servicos/recursos";
import type { DadosProduto, Produto } from "../../servicos/recursos";
import { lerIdDaRota, lerPreco, precoParaCampo } from "../../utils/numeros";
import { validarPrecoTexto, validarTamanho } from "../../validadores/validadores";

type ValoresProduto = { nome: string; descricao: string; preco: string; idCategoria: string };

const VAZIO: ValoresProduto = { nome: "", descricao: "", preco: "", idCategoria: "" };

function paraFormulario(produto: Produto): ValoresProduto {
    return {
        nome: produto.nome,
        descricao: produto.descricao ?? "",
        preco: precoParaCampo(produto.preco), // 6 -> "6,00"
        idCategoria: String(produto.idCategoria),
    };
}

// Converte o texto do formulário nos tipos certos: "12,50" -> 12.5 e "3" -> 3
function paraDados(valores: ValoresProduto): DadosProduto {
    const descricao = valores.descricao.trim();
    return {
        nome: valores.nome.trim(),
        descricao: descricao === "" ? null : descricao,
        preco: lerPreco(valores.preco),
        idCategoria: Number(valores.idCategoria),
    };
}

// Busca TODAS as categorias (pra montar a caixa de seleção)
function buscarCategorias() {
    return listarTodos((pagina, limite) => clienteCategorias.listar(pagina, limite));
}

// Serve para cadastrar (/produtos/novo) e editar (/produtos/:id/editar)
export default function FormProduto() {
    const { id } = useParams();
    const { dados: categorias, erro, carregando } = useDados(buscarCategorias);

    if (erro !== "") {
        return (
            <main>
                <h1>Produto</h1>
                <p className="erro-api" role="alert">
                    {erro}
                </p>
                <Link to="/produtos">Voltar</Link>
            </main>
        );
    }

    if (carregando || categorias === null) {
        return (
            <main>
                <p>Carregando...</p>
            </main>
        );
    }

    // Produto precisa de uma categoria: sem nenhuma cadastrada, orienta a criar primeiro
    if (categorias.length === 0) {
        return (
            <main>
                <h1>Novo produto</h1>
                <p>Antes de cadastrar um produto, cadastre pelo menos uma categoria.</p>
                <Link to="/categorias/novo">Cadastrar categoria</Link>
            </main>
        );
    }

    const campos: CampoFormulario<ValoresProduto>[] = [
        {
            nome: "nome",
            rotulo: "Nome",
            tipo: "texto",
            obrigatorio: true,
            validar: (valor) => validarTamanho(valor, "O nome", 2, 100),
        },
        {
            nome: "idCategoria",
            rotulo: "Categoria",
            tipo: "selecao",
            obrigatorio: true,
            opcoes: categorias.map((categoria) => ({ valor: String(categoria.id), rotulo: categoria.nome })),
        },
        {
            nome: "preco",
            rotulo: "Preço (R$)",
            tipo: "texto",
            obrigatorio: true,
            placeholder: "12,50",
            ajuda: "Use vírgula ou ponto para os centavos.",
            validar: (valor) => validarPrecoTexto(valor),
        },
        {
            nome: "descricao",
            rotulo: "Descrição",
            tipo: "texto",
            ajuda: "Opcional. Até 255 caracteres.",
            validar: (valor) => validarTamanho(valor, "A descrição", 0, 255),
        },
    ];

    return (
        <PaginaFormCrud<Produto, DadosProduto, ValoresProduto>
            cliente={clienteProdutos}
            idRegistro={lerIdDaRota(id)}
            tituloNovo="Novo produto"
            tituloEditar="Editar produto"
            campos={campos}
            valoresVazios={VAZIO}
            paraFormulario={paraFormulario}
            paraDados={paraDados}
            rotaLista="/produtos"
            mensagemCriado="Produto cadastrado com sucesso."
            mensagemAtualizado="Produto atualizado com sucesso."
        />
    );
}
