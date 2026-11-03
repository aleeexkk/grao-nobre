import { createContext } from "react";
import type { Usuario } from "../servicos/api";

// O que o contexto de autenticação oferece pra qualquer tela do site
export interface ValorAuth {
    usuario: Usuario | null; // quem está logado (null = ninguém)
    carregando: boolean; // true enquanto confere, ao abrir o site, se o token guardado ainda vale
    entrar: (email: string, senha: string) => Promise<void>; // faz o login
    sair: () => void; // faz o logout
    atualizarUsuario: (usuario: Usuario) => void; // atualiza os dados mostrados (ex: depois de editar o perfil)
}

// Contexto = uma "caixa compartilhada": o AuthProvider coloca os dados nela e
// qualquer tela lê de lá, sem precisar ficar passando de componente em componente.
export const AuthContexto = createContext<ValorAuth | null>(null);
