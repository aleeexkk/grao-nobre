import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContexto } from "./AuthContexto";
import type { ValorAuth } from "./AuthContexto";
import { buscarPerfil, ErroApi, fazerLogin } from "../servicos/api";
import type { Usuario } from "../servicos/api";
import { definirAoSessaoExpirar, limparToken, lerToken, salvarToken } from "../servicos/sessao";

// Componente que "abraça" o site inteiro e guarda quem está logado, pra todas as telas saberem.
export default function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    // Só fica "carregando" se existe um token guardado pra conferir
    const [carregando, setCarregando] = useState<boolean>(() => lerToken() !== null);

    // Ao abrir o site: se tem token guardado, pergunta pra API quem é (assim o login sobrevive ao F5)
    useEffect(() => {
        if (lerToken() === null) return;

        let cancelado = false; // evita mexer no estado se o componente já saiu da tela

        buscarPerfil()
            .then((perfil) => {
                if (!cancelado) setUsuario({ id: perfil.id, nome: perfil.nome, email: perfil.email });
            })
            .catch((erro: unknown) => {
                // Token vencido ou falso (401): apaga. Se foi só o servidor fora do ar, mantém o token
                if (erro instanceof ErroApi && erro.status === 401) limparToken();
            })
            .finally(() => {
                if (!cancelado) setCarregando(false);
            });

        return () => {
            cancelado = true;
        };
    }, []);

    // Se o token vencer no meio do uso, a API avisa (401) e aqui esquecemos o usuário: o site volta pro login
    useEffect(() => {
        definirAoSessaoExpirar(() => setUsuario(null));
        return () => definirAoSessaoExpirar(null);
    }, []);

    // Login: pede o token pra API, guarda no localStorage e lembra quem entrou
    const entrar = useCallback(async (email: string, senha: string) => {
        const resposta = await fazerLogin(email, senha);
        salvarToken(resposta.token);
        setUsuario(resposta.usuario);
    }, []);

    // Logout: esquece o token e o usuário
    const sair = useCallback(() => {
        limparToken();
        setUsuario(null);
    }, []);

    const atualizarUsuario = useCallback((novo: Usuario) => {
        setUsuario(novo);
    }, []);

    // useMemo: só cria um valor novo quando algo mudou de verdade (evita redesenhar telas à toa)
    const valor: ValorAuth = useMemo(
        () => ({ usuario, carregando, entrar, sair, atualizarUsuario }),
        [usuario, carregando, entrar, sair, atualizarUsuario]
    );

    return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}
