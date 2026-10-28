import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";

// App = o "mapa" do site: cada endereço (path) abre uma tela (element)
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Quem entra na raiz "/" é mandado pro cadastro */}
                <Route path="/" element={<Navigate to="/cadastro" replace />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );
}