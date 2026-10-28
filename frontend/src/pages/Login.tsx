import { Link } from "react-router-dom";

// Tela de login: por enquanto é só um esqueleto (o login de verdade vem na próxima sprint)
export default function Login() {
    return (
        <main>
            <h1>Login</h1>
            <p>Em breve: entrar com e-mail e senha.</p>
            {/* Link troca de tela sem recarregar a página inteira */}
            <Link to="/cadastro">Criar uma conta</Link>
        </main>
    );
}