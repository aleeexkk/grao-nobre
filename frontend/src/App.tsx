import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./contexto/AuthProvider";
import AreaLogada from "./components/AreaLogada";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import ListaCategorias from "./pages/categorias/ListaCategorias";
import FormCategoria from "./pages/categorias/FormCategoria";
import ListaProdutos from "./pages/produtos/ListaProdutos";
import FormProduto from "./pages/produtos/FormProduto";
import ListaPedidos from "./pages/pedidos/ListaPedidos";
import FormPedido from "./pages/pedidos/FormPedido";
import DetalhePedido from "./pages/pedidos/DetalhePedido";
import FormItemPedido from "./pages/pedidos/FormItemPedido";

// O painel (com os gráficos) é a parte mais pesada do site: só é baixado quando a pessoa abre o painel,
// e assim o login e o cadastro carregam bem mais rápido.
const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
    return (
        <BrowserRouter>
            {/* AuthProvider guarda quem está logado e deixa todas as telas lerem isso */}
            <AuthProvider>
                <Suspense
                    fallback={
                        <main>
                            <p>Carregando...</p>
                        </main>
                    }
                >
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />

                        {/* Telas públicas */}
                        <Route path="/cadastro" element={<Cadastro />} />
                        <Route path="/login" element={<Login />} />

                        {/* Telas que exigem login: ficam dentro da AreaLogada (o "porteiro") */}
                        <Route element={<AreaLogada />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/perfil" element={<Perfil />} />

                            {/* Cada CRUD tem uma tela de LISTA e uma de FORMULÁRIO (cadastrar/editar) */}
                            <Route path="/categorias" element={<ListaCategorias />} />
                            <Route path="/categorias/novo" element={<FormCategoria />} />
                            <Route path="/categorias/:id/editar" element={<FormCategoria />} />

                            <Route path="/produtos" element={<ListaProdutos />} />
                            <Route path="/produtos/novo" element={<FormProduto />} />
                            <Route path="/produtos/:id/editar" element={<FormProduto />} />

                            <Route path="/pedidos" element={<ListaPedidos />} />
                            <Route path="/pedidos/novo" element={<FormPedido />} />
                            <Route path="/pedidos/:id/editar" element={<FormPedido />} />
                            {/* Os itens ficam dentro do pedido */}
                            <Route path="/pedidos/:id/itens" element={<DetalhePedido />} />
                            <Route path="/pedidos/:id/itens/novo" element={<FormItemPedido />} />
                            <Route path="/pedidos/:id/itens/:idItem/editar" element={<FormItemPedido />} />
                        </Route>

                        {/* Qualquer endereço que não existe */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}
