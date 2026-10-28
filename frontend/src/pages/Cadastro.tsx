import { Link } from "react-router-dom";

// Tela de cadastro: o formulário de verdade vem nos próximos passos
export default function Cadastro() {
    return (
        <main>
            <h1>Cadastro</h1>
            <p>Em breve: formulário de cadastro.</p>
            <Link to="/login">Já tenho conta</Link>
        </main>
    );
}