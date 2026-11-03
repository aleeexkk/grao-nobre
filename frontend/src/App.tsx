import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./contexto/AuthProvider";
import AreaLogada from "./components/AreaLogada";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";

export default function App() {
    return (
        <BrowserRouter>
            {/* AuthProvider guarda quem está logado e deixa todas as telas lerem isso */}
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Telas públicas */}
                    <Route path="/cadastro" element={<Cadastro />} />
                    <Route path="/login" element={<Login />} />

                    {/* Telas que exigem login: ficam dentro da AreaLogada (o "porteiro") */}
                    <Route element={<AreaLogada />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/perfil" element={<Perfil />} />
                    </Route>

                    {/* Qualquer endereço que não existe */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
