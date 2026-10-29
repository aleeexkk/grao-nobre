import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom"; // NOVO: useNavigate troca de tela por código
import CampoTexto from "../components/CampoTexto";
import {
    validarNome,
    validarEmail,
    validarCpf,
    validarSenha,
    validarConfirmacao,
} from "../validadores/validadores";
import { cadastrarUsuario, ErroApi } from "../servicos/api"; // NOVO

export default function Cadastro() {
    const navigate = useNavigate(); // NOVO

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [tentouEnviar, setTentouEnviar] = useState(false);
    const [erroApi, setErroApi] = useState(""); // NOVO: mensagem de erro que veio do servidor
    const [enviando, setEnviando] = useState(false); // NOVO: true enquanto espera a resposta

    const erros = {
        nome: validarNome(nome),
        email: validarEmail(email),
        cpf: validarCpf(cpf),
        senha: validarSenha(senha),
        confirmacao: validarConfirmacao(senha, confirmacao),
    };

    function mostrar(valor: string, erro: string): string {
        return valor !== "" || tentouEnviar ? erro : "";
    }

    // NOVO: agora é async porque espera a resposta do servidor
    async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setTentouEnviar(true);
        setErroApi(""); // limpa o erro da tentativa anterior

        const temErro = Object.values(erros).some((erro) => erro !== "");
        if (temErro) return;

        setEnviando(true);
        try {
            await cadastrarUsuario({ nome, email, senha, cpf });
            navigate("/login"); // deu certo: vai pra tela de login
        } catch (erro) {
            // Se for um ErroApi, mostra a mensagem dele; senão, uma mensagem genérica
            setErroApi(erro instanceof ErroApi ? erro.message : "Erro inesperado. Tente novamente.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main>
            <h1>Cadastro</h1>

            <form onSubmit={aoEnviar} noValidate>
                <CampoTexto
                    id="nome"
                    rotulo="Nome"
                    valor={nome}
                    aoMudar={setNome}
                    erro={mostrar(nome, erros.nome)}
                />
                <CampoTexto
                    id="email"
                    rotulo="E-mail"
                    tipo="email"
                    valor={email}
                    aoMudar={setEmail}
                    erro={mostrar(email, erros.email)}
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
                />
                <CampoTexto
                    id="confirmacao"
                    rotulo="Confirmar senha"
                    tipo="password"
                    valor={confirmacao}
                    aoMudar={setConfirmacao}
                    erro={mostrar(confirmacao, erros.confirmacao)}
                />

                {/* NOVO: erro que veio do servidor (e-mail repetido, servidor fora do ar...) */}
                {erroApi && (
                    <p className="erro-api" role="alert">
                        {erroApi}
                    </p>
                )}

                {/* NOVO: botão trava enquanto envia, pra não clicar duas vezes */}
                <button type="submit" disabled={enviando}>
                    {enviando ? "Enviando..." : "Cadastrar"}
                </button>
            </form>

            <Link to="/login">Já tenho conta</Link>
        </main>
    );
}