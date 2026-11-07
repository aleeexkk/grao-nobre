import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDados } from "../../hooks/useDados";
import type { ClienteCrud } from "../../servicos/crud";
import FormularioCrud from "./FormularioCrud";
import type { CampoFormulario } from "./FormularioCrud";

interface PaginaFormCrudProps<TRegistro, TDados, V extends Record<string, string>> {
    cliente: Pick<ClienteCrud<TRegistro, TDados>, "buscar" | "criar" | "atualizar">; // PRECISA ser estável (constante fora do componente)
    idRegistro: number | null; // null = cadastrando um novo; número = editando esse registro
    tituloNovo: string; // ex: "Nova categoria"
    tituloEditar: string; // ex: "Editar categoria"
    campos: CampoFormulario<V>[];
    valoresVazios: V; // valores do formulário em branco
    paraFormulario: (registro: TRegistro) => V; // registro da API -> valores (texto) do formulário
    paraDados: (valores: V) => TDados; // valores (texto) do formulário -> dados que a API espera
    rotaLista: string; // pra onde voltar depois de salvar / cancelar
    rotaAposCriar?: (criado: TRegistro) => string; // se precisar ir pra outro lugar depois de criar (ex: itens do pedido)
    mensagemCriado: string;
    mensagemAtualizado: string;
    aviso?: string;
}

// Tela GENÉRICA de cadastro/edição: se vier um id, busca o registro e preenche o formulário;
// ao salvar, volta pra lista com uma mensagem de sucesso.
export default function PaginaFormCrud<TRegistro, TDados, V extends Record<string, string>>({
    cliente,
    idRegistro,
    tituloNovo,
    tituloEditar,
    campos,
    valoresVazios,
    paraFormulario,
    paraDados,
    rotaLista,
    rotaAposCriar,
    mensagemCriado,
    mensagemAtualizado,
    aviso,
}: PaginaFormCrudProps<TRegistro, TDados, V>) {
    const navigate = useNavigate();

    // Só busca o registro quando está editando (no cadastro não há o que buscar)
    const carregar = useCallback(
        () => (idRegistro === null ? Promise.resolve(null) : cliente.buscar(idRegistro)),
        [cliente, idRegistro]
    );
    const { dados: registro, erro, carregando } = useDados<TRegistro | null>(carregar);

    async function salvar(valores: V) {
        const dados = paraDados(valores);
        if (idRegistro === null) {
            const criado = await cliente.criar(dados);
            navigate(rotaAposCriar ? rotaAposCriar(criado) : rotaLista, { state: { mensagem: mensagemCriado } });
        } else {
            await cliente.atualizar(idRegistro, dados);
            navigate(rotaLista, { state: { mensagem: mensagemAtualizado } });
        }
    }

    // Editando: espera o registro chegar (ou mostra o erro, ex: 404 "não encontrado")
    if (idRegistro !== null) {
        if (erro !== "") {
            return (
                <main>
                    <h1>{tituloEditar}</h1>
                    <p className="erro-api" role="alert">
                        {erro}
                    </p>
                    <Link to={rotaLista}>Voltar</Link>
                </main>
            );
        }
        if (carregando || registro === null) {
            return (
                <main>
                    <p>Carregando...</p>
                </main>
            );
        }
    }

    return (
        <FormularioCrud<V>
            // key: se mudar de registro, o formulário recomeça com os valores certos
            key={idRegistro ?? "novo"}
            titulo={idRegistro === null ? tituloNovo : tituloEditar}
            campos={campos}
            valoresIniciais={registro === null ? valoresVazios : paraFormulario(registro)}
            textoEnviar={idRegistro === null ? "Cadastrar" : "Salvar alterações"}
            aoEnviar={salvar}
            rotaCancelar={rotaLista}
            aviso={aviso}
        />
    );
}
