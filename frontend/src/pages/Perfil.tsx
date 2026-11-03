import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CampoTexto from "../components/CampoTexto";
import { useAuth } from "../contexto/useAuth";
import { atualizarPerfil, buscarPerfil, ErroApi } from "../servicos/api";
import type { PerfilUsuario } from "../servicos/api";
import { formatarCpf } from "../utils/formatacao";
import { validarConfirmacao, validarCpf, validarNome, validarSenha } from "../validadores/validadores";

// Formulário de edição. É uma função separada da página: só aparece depois que o perfil foi carregado,
// então já nasce com os dados certos dentro dos campos.
function FormularioPerfil({ perfil }: { perfil: PerfilUsuario }) {
    const { sair, atualizarUsuario } = useAuth();

    const [nome, setNome] = useState(perfil.nome);
    const [cpf, setCpf] = useState(formatarCpf(perfil.cpf));
    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [tentouEnviar, setTentouEnviar] = useState(false);
    const [erroApi, setErroApi] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [enviando, setEnviando] = useState(false);

    // O e-mail não entra aqui: ele não pode ser alterado
    const erros = {
        nome: validarNome(nome),
        cpf: validarCpf(cpf),
        senha: validarSenha(senha),
        confirmacao: validarConfirmacao(senha, confirmacao),
    };

    function mostrar(valor: string, erro: string): string {
        return valor !== "" || tentouEnviar ? erro : "";
    }

    async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setTentouEnviar(true);
        setErroApi("");
        setSucesso("");

        const temErro = Object.values(erros).some((erro) => erro !== "");
        if (temErro) return;

        setEnviando(true);
        try {
            const atualizado = await atualizarPerfil(perfil.id, { nome, cpf, senha });
            // Atualiza o nome que aparece no cabeçalho (o contexto é global)
            atualizarUsuario({ id: atualizado.id, nome: atualizado.nome, email: atualizado.email });
            setNome(atualizado.nome);
            setCpf(formatarCpf(atualizado.cpf));
            setSenha("");
            setConfirmacao("");
            setTentouEnviar(false);
            setSucesso("Dados atualizados com sucesso!");
        } catch (erro) {
            if (erro instanceof ErroApi && erro.status === 401) {
                sair(); // sessão venceu: volta pro login
                return;
            }
            setErroApi(erro instanceof ErroApi ? erro.message : "Erro inesperado. Tente novamente.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <form onSubmit={aoEnviar} noValidate>
            <CampoTexto id="nome" rotulo="Nome" valor={nome} aoMudar={setNome} erro={mostrar(nome, erros.nome)} />
            <CampoTexto
                id="email"
                rotulo="E-mail"
                tipo="email"
                valor={perfil.email}
                aoMudar={() => {}}
                desabilitado
                ajuda="O e-mail não pode ser alterado."
            />
            <CampoTexto
                id="cpf"
                rotulo="CPF"
                placeholder="000.000.000-00"
                valor={cpf}
                aoMudar={setCpf}
                erro={mostrar(cpf, erros.cpf)}
            />
            <CampoTexto
                id="senha"
                rotulo="Senha"
                tipo="password"
                valor={senha}
                aoMudar={setSenha}
                erro={mostrar(senha, erros.senha)}
                ajuda="Por segurança, digite a sua senha (pode ser a mesma de hoje ou uma nova)."
                autoComplete="new-password"
            />
            <CampoTexto
                id="confirmacao"
                rotulo="Confirmar senha"
                tipo="password"
                valor={confirmacao}
                aoMudar={setConfirmacao}
                erro={mostrar(confirmacao, erros.confirmacao)}
                autoComplete="new-password"
            />

            {sucesso && (
                <p className="sucesso-api" role="status">
                    {sucesso}
                </p>
            )}
            {erroApi && (
                <p className="erro-api" role="alert">
                    {erroApi}
                </p>
            )}

            <button type="submit" disabled={enviando}>
                {enviando ? "Salvando..." : "Salvar alterações"}
            </button>
        </form>
    );
}

// A página: busca o perfil na API e mostra o formulário
export default function Perfil() {
    const { sair } = useAuth();
    const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let cancelado = false;

        buscarPerfil()
            .then((dados) => {
                if (!cancelado) setPerfil(dados);
            })
            .catch((falha: unknown) => {
                if (cancelado) return;
                if (falha instanceof ErroApi && falha.status === 401) {
                    sair(); // sessão venceu: volta pro login
                    return;
                }
                setErro(falha instanceof ErroApi ? falha.message : "Erro inesperado. Tente novamente.");
            });

        return () => {
            cancelado = true;
        };
    }, [sair]);

    return (
        <main>
            <h1>Meu perfil</h1>
            <p>Atualize os seus dados.</p>

            {erro && (
                <p className="erro-api" role="alert">
                    {erro}
                </p>
            )}
            {perfil === null && erro === "" && <p>Carregando...</p>}
            {perfil !== null && <FormularioPerfil perfil={perfil} />}
        </main>
    );
}
