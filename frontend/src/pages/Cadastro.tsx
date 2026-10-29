import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import CampoTexto from "../components/CampoTexto";
import {
    validarNome,
    validarEmail,
    validarCpf,
    validarSenha,
    validarConfirmacao,
} from "../validadores/validadores";

export default function Cadastro() {
    // Um useState pra cada campo: guarda o que foi digitado
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");

    // Vira true quando a pessoa clica em "Cadastrar" (aí mostramos todos os erros)
    const [tentouEnviar, setTentouEnviar] = useState(false);

    // Recalcula o erro de cada campo a cada digitação ("" = sem erro)
    const erros = {
        nome: validarNome(nome),
        email: validarEmail(email),
        cpf: validarCpf(cpf),
        senha: validarSenha(senha),
        confirmacao: validarConfirmacao(senha, confirmacao),
    };

    // Só mostra o erro de um campo se a pessoa já digitou algo nele (ou já tentou enviar)
    function mostrar(valor: string, erro: string): string {
        return valor !== "" || tentouEnviar ? erro : "";
    }

    function aoEnviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault(); // impede a página de recarregar ao enviar o formulário
        setTentouEnviar(true);

        // Se algum campo tiver erro, para por aqui
        const temErro = Object.values(erros).some((erro) => erro !== "");
        if (temErro) return;

        // Tudo certo. Atenção: nunca coloque a senha no console!
        console.log("Dados válidos, prontos pra enviar:", { nome, email, cpf });
    }

    return (
        <main>
            <h1>Cadastro</h1>

            {/* noValidate: desliga as mensagens do navegador pra aparecerem as nossas */}
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

                <button type="submit">Cadastrar</button>
            </form>

            <Link to="/login">Já tenho conta</Link>
        </main>
    );
}