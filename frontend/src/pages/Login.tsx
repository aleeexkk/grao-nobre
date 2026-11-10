import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import CampoTexto from "../components/CampoTexto";
import { useAuth } from "../contexto/useAuth";
import { useAvisoTemporario } from "../hooks/useAvisoTemporario";
import { ErroApi } from "../servicos/api";
import { validarEmail, validarSenhaObrigatoria } from "../validadores/validadores";

// Confere se a pessoa chegou aqui logo depois de se cadastrar (o Cadastro avisa pelo "state" da navegação)
function veioDoCadastro(estado: unknown): boolean {
    return typeof estado === "object" && estado !== null && "cadastrado" in estado && estado.cadastrado === true;
}

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, carregando, entrar } = useAuth();

    // Aviso de "Cadastro realizado!" (só aparece se veio do cadastro) e some sozinho depois de uns segundos
    const [avisoCadastro] = useAvisoTemporario(
        veioDoCadastro(location.state) ? "Cadastro realizado! Entre com o seu e-mail e a sua senha." : ""
    );

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [tentouEnviar, setTentouEnviar] = useState(false);
    const [erroApi, setErroApi] = useState(""); // mensagem de erro que veio do servidor
    const [enviando, setEnviando] = useState(false); // true enquanto espera a resposta

    const erros = {
        email: validarEmail(email),
        senha: validarSenhaObrigatoria(senha),
    };

    function mostrar(valor: string, erro: string): string {
        return valor !== "" || tentouEnviar ? erro : "";
    }

    async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setTentouEnviar(true);
        setErroApi(""); // limpa o erro da tentativa anterior

        const temErro = Object.values(erros).some((erro) => erro !== "");
        if (temErro) return;

        setEnviando(true);
        try {
            await entrar(email, senha);
            navigate("/dashboard"); // deu certo: vai pra área logada
        } catch (erro) {
            // Erros da API viram mensagem amigável (ex: "E-mail ou senha inválidos.")
            setErroApi(erro instanceof ErroApi ? erro.message : "Erro inesperado. Tente novamente.");
        } finally {
            setEnviando(false);
        }
    }

    // Quem já está logado não precisa ver o login: vai direto pro painel
    if (!carregando && usuario !== null) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <main>
            <h1>Login</h1>
            <p>Entre para ver o painel da cafeteria.</p>

            <form onSubmit={aoEnviar} noValidate>
                {/* Aviso de sucesso depois do cadastro */}
                {avisoCadastro !== "" && (
                    <p className="sucesso-api" role="status">
                        {avisoCadastro}
                    </p>
                )}

                <CampoTexto
                    id="email"
                    rotulo="E-mail"
                    tipo="email"
                    valor={email}
                    aoMudar={setEmail}
                    erro={mostrar(email, erros.email)}
                    autoComplete="email"
                />
                <CampoTexto
                    id="senha"
                    rotulo="Senha"
                    tipo="password"
                    valor={senha}
                    aoMudar={setSenha}
                    erro={mostrar(senha, erros.senha)}
                    autoComplete="current-password"
                />

                {/* Erro que veio do servidor (login inválido, servidor fora do ar...) */}
                {erroApi && (
                    <p className="erro-api" role="alert">
                        {erroApi}
                    </p>
                )}

                {/* Botão trava enquanto envia, pra não clicar duas vezes */}
                <button type="submit" disabled={enviando}>
                    {enviando ? "Entrando..." : "Entrar"}
                </button>
            </form>

            <Link to="/cadastro">Criar uma conta</Link>
        </main>
    );
}
