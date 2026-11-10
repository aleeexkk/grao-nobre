import type { AddressInfo } from "node:net";
import { criarApp } from "../app";
import { TokenServico } from "../servicos/TokenServico";
import { UsuarioRepositorioMemoria } from "./UsuarioRepositorioMemoria";
import { criarDependenciasDeTeste } from "./dependenciasDeTeste";

// Ferramentas que os testes de API (produtos, pedidos, itens, estatísticas) têm em comum.
// Cada grupo de testes chama iniciar() e começa do zero: app novo, repositórios de mentira vazios.

export const SENHA = "Cafe@2026x";
const SEGREDO = "segredo-de-teste-com-mais-de-16-caracteres";

// Como as respostas da API chegam no JSON
export interface CategoriaJson {
    id: number;
    nome: string;
    descricao: string | null;
}
export interface ProdutoJson {
    id: number;
    nome: string;
    descricao: string | null;
    preco: number;
    idCategoria: number;
    categoria: string;
}
export interface PedidoJson {
    id: number;
    idUsuario: number;
    atendente: string;
    cliente: string | null;
    status: string;
    dataHora: string;
    quantidadeItens: number;
    total: number;
}
export interface ItemJson {
    id: number;
    idPedido: number;
    idProduto: number;
    produto: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
}
export interface PaginaJson<T> {
    itens: T[];
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}
export interface Resposta<T> {
    status: number;
    corpo: T;
}

// Sobe um app NOVO, cadastra a Ana, faz login e devolve as ferramentas do teste
export async function iniciar() {
    const tokens = new TokenServico(SEGREDO, 60);
    const usuarios = new UsuarioRepositorioMemoria();
    const app = criarApp(criarDependenciasDeTeste(usuarios, tokens));
    const servidor = app.listen(0); // porta 0 = o sistema escolhe uma livre
    await new Promise<void>((pronto) => servidor.once("listening", () => pronto()));
    const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;

    // Chamada HTTP de verdade contra o app. Aceita resposta sem corpo (o 204 não devolve nada)
    async function chamar<T = Record<string, unknown>>(
        metodo: string,
        caminho: string,
        corpo?: unknown,
        token?: string
    ): Promise<Resposta<T>> {
        const resposta = await fetch(base + caminho, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: corpo === undefined ? undefined : JSON.stringify(corpo),
        });
        const texto = await resposta.text();
        return { status: resposta.status, corpo: (texto ? JSON.parse(texto) : null) as T };
    }

    // Cadastra a Ana e faz login pra ter o token (o "crachá")
    await chamar("POST", "/usuarios", { nome: "Ana Lima", email: "ana@email.com", senha: SENHA, cpf: "529.982.247-25" });
    const login = await chamar<{ token: string }>("POST", "/auth/login", { email: "ana@email.com", senha: SENHA });
    const token = login.corpo.token;

    // Atalho: chamada já com o token de quem está logado
    const logado = <T = Record<string, unknown>>(metodo: string, caminho: string, corpo?: unknown) =>
        chamar<T>(metodo, caminho, corpo, token);

    return {
        base, // endereço do servidor de teste (pra testes que precisam de um fetch "cru", com cabeçalhos próprios)
        chamar,
        logado,
        // Atalhos pra montar o cenário do teste
        criarCategoria: async (nome: string) => (await logado<CategoriaJson>("POST", "/categorias", { nome })).corpo,
        criarProduto: async (nome: string, preco: number, idCategoria: number) =>
            (await logado<ProdutoJson>("POST", "/produtos", { nome, preco, idCategoria })).corpo,
        criarPedido: async (cliente?: string) =>
            (await logado<PedidoJson>("POST", "/pedidos", cliente === undefined ? {} : { cliente })).corpo,
        adicionarItem: async (idPedido: number, idProduto: number, quantidade: number) =>
            (await logado<ItemJson>("POST", "/itens-pedido", { idPedido, idProduto, quantidade })).corpo,
        mudarStatus: (idPedido: number, status: string) =>
            logado<PedidoJson>("PUT", `/pedidos/${idPedido}`, { status }),
        fechar: () => servidor.close(),
    };
}
export type Ambiente = Awaited<ReturnType<typeof iniciar>>;
