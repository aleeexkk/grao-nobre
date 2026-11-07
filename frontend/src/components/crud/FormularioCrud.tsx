import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { mensagemDeErro } from "../../servicos/api";
import CampoSelecao from "../CampoSelecao";
import type { OpcaoSelecao } from "../CampoSelecao";
import CampoTexto from "../CampoTexto";

// Descrição de UM campo do formulário. <V> = o "formato" dos valores do formulário
// (um objeto onde tudo é texto, ex: { nome: string; preco: string }).
export interface CampoFormulario<V> {
    nome: keyof V & string; // qual propriedade de V este campo edita
    rotulo: string;
    tipo: "texto" | "selecao";
    obrigatorio?: boolean; // true = não deixa enviar vazio
    ajuda?: string;
    placeholder?: string;
    opcoes?: OpcaoSelecao[]; // só para tipo "selecao"
    desabilitado?: boolean;
    validar?: (valor: string, valores: V) => string; // regra extra (ex: formato do preço). Devolve "" se OK
}

interface FormularioCrudProps<V extends Record<string, string>> {
    titulo: string;
    campos: CampoFormulario<V>[];
    valoresIniciais: V;
    textoEnviar: string; // ex: "Cadastrar" / "Salvar alterações"
    aoEnviar: (valores: V) => Promise<void>; // se lançar erro, a mensagem aparece no formulário
    rotaCancelar: string; // pra onde o botão "Cancelar" volta
    aviso?: string; // texto informativo opcional no topo
}

// Formulário GENÉRICO: recebe a lista de campos e cuida de tudo que se repete
// (valores, validação de campos obrigatórios, erros, botão travado enquanto envia).
export default function FormularioCrud<V extends Record<string, string>>({
    titulo,
    campos,
    valoresIniciais,
    textoEnviar,
    aoEnviar,
    rotaCancelar,
    aviso,
}: FormularioCrudProps<V>) {
    const [valores, setValores] = useState<V>(valoresIniciais);
    const [tentouEnviar, setTentouEnviar] = useState(false);
    const [erroApi, setErroApi] = useState("");
    const [enviando, setEnviando] = useState(false);

    // Mensagem de erro de um campo: primeiro "é obrigatório?", depois a regra extra do campo
    function erroDoCampo(campo: CampoFormulario<V>): string {
        const valor = valores[campo.nome] ?? "";
        if (campo.obrigatorio === true && valor.trim() === "") {
            return campo.tipo === "selecao" ? `Selecione ${campo.rotulo.toLowerCase()}.` : `Preencha o campo ${campo.rotulo.toLowerCase()}.`;
        }
        // Campo opcional vazio não precisa passar pelas outras regras
        if (valor.trim() === "") return "";
        return campo.validar ? campo.validar(valor, valores) : "";
    }

    // Só mostra o erro depois que a pessoa começou a preencher o campo (ou tentou enviar)
    function erroVisivel(campo: CampoFormulario<V>): string {
        const valor = valores[campo.nome] ?? "";
        return valor !== "" || tentouEnviar ? erroDoCampo(campo) : "";
    }

    function mudarCampo(nome: keyof V & string, novoValor: string) {
        setValores((atuais) => ({ ...atuais, [nome]: novoValor }));
    }

    async function tratarEnvio(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setTentouEnviar(true);
        setErroApi("");

        if (campos.some((campo) => erroDoCampo(campo) !== "")) return; // tem campo com problema: não envia

        setEnviando(true);
        try {
            await aoEnviar(valores);
        } catch (erro) {
            setErroApi(mensagemDeErro(erro)); // ex: "Já existe uma categoria com esse nome."
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main>
            <h1>{titulo}</h1>

            <form onSubmit={(evento) => void tratarEnvio(evento)} noValidate>
                {aviso && <p className="campo-ajuda">{aviso}</p>}

                {campos.map((campo) =>
                    campo.tipo === "selecao" ? (
                        <CampoSelecao
                            key={campo.nome}
                            id={campo.nome}
                            rotulo={campo.rotulo}
                            valor={valores[campo.nome] ?? ""}
                            opcoes={campo.opcoes ?? []}
                            aoMudar={(novo) => mudarCampo(campo.nome, novo)}
                            erro={erroVisivel(campo)}
                            desabilitado={campo.desabilitado}
                            ajuda={campo.ajuda}
                        />
                    ) : (
                        <CampoTexto
                            key={campo.nome}
                            id={campo.nome}
                            rotulo={campo.rotulo}
                            valor={valores[campo.nome] ?? ""}
                            aoMudar={(novo) => mudarCampo(campo.nome, novo)}
                            erro={erroVisivel(campo)}
                            desabilitado={campo.desabilitado}
                            ajuda={campo.ajuda}
                            placeholder={campo.placeholder}
                        />
                    )
                )}

                {erroApi && (
                    <p className="erro-api" role="alert">
                        {erroApi}
                    </p>
                )}

                <div className="botoes-form">
                    <button type="submit" disabled={enviando}>
                        {enviando ? "Salvando..." : textoEnviar}
                    </button>
                    <Link to={rotaCancelar} className="botao botao-secundario">
                        Cancelar
                    </Link>
                </div>
            </form>
        </main>
    );
}
