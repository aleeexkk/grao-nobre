import { useState } from "react";
import { Link } from "react-router-dom";
import CampoTexto from "../components/CampoTexto";
import { validarEmail } from "../validadores/validadores";

export default function Cadastro() {
    // useState = a "memória" do componente: guarda o que foi digitado
    const [email, setEmail] = useState("");

    return (
        <main>
            <h1>Cadastro</h1>

            <CampoTexto
                id="email"
                rotulo="E-mail"
                tipo="email"
                valor={email}
                aoMudar={setEmail}
                // Só valida depois que a pessoa começou a digitar
                erro={email ? validarEmail(email) : ""}
            />

            <Link to="/login">Já tenho conta</Link>
        </main>
    );
}