import { requisicao } from "./api";

// Uma página de resultados (o mesmo formato que o back-end devolve nas listagens)
export interface Pagina<T> {
    itens: T[];
    pagina: number; // página atual (começa em 1)
    limite: number; // quantos itens por página
    total: number; // quantos registros existem no total
    totalPaginas: number;
}

// Filtros opcionais da listagem (ex: { idPedido: 5 } lista só os itens daquele pedido)
export type Filtros = Record<string, number>;

// "Contrato" do cliente de um CRUD: o que o front sabe pedir pra API de qualquer recurso.
//   TRegistro = o que a API devolve (ex: Produto)
//   TDados    = o que a gente envia pra criar/editar (ex: DadosProduto)
export interface ClienteCrud<TRegistro, TDados> {
    listar(pagina: number, limite: number, filtros?: Filtros): Promise<Pagina<TRegistro>>;
    buscar(id: number): Promise<TRegistro>;
    criar(dados: TDados): Promise<TRegistro>;
    atualizar(id: number, dados: TDados): Promise<TRegistro>;
    excluir(id: number): Promise<void>;
}

// Fábrica GENÉRICA (a mesma ideia do back-end): escreve as 5 chamadas UMA vez e serve pra categorias,
// produtos, pedidos e itens. Só muda o caminho (ex: "/produtos") e os tipos.
export function criarClienteCrud<TRegistro, TDados>(caminho: string): ClienteCrud<TRegistro, TDados> {
    return {
        listar(pagina, limite, filtros = {}) {
            // Monta "?pagina=1&limite=10&idPedido=5" (URLSearchParams cuida dos caracteres especiais)
            const consulta = new URLSearchParams({ pagina: String(pagina), limite: String(limite) });
            for (const [nome, valor] of Object.entries(filtros)) {
                consulta.set(nome, String(valor));
            }
            return requisicao<Pagina<TRegistro>>("GET", `${caminho}?${consulta.toString()}`, undefined, true);
        },
        buscar(id) {
            return requisicao<TRegistro>("GET", `${caminho}/${id}`, undefined, true);
        },
        criar(dados) {
            return requisicao<TRegistro>("POST", caminho, dados, true);
        },
        atualizar(id, dados) {
            return requisicao<TRegistro>("PUT", `${caminho}/${id}`, dados, true);
        },
        async excluir(id) {
            await requisicao<unknown>("DELETE", `${caminho}/${id}`, undefined, true);
        },
    };
}

// Junta TODAS as páginas de uma listagem numa lista só (usado nas caixas de seleção, ex: escolher a categoria)
export async function listarTodos<T>(buscarPagina: (pagina: number, limite: number) => Promise<Pagina<T>>): Promise<T[]> {
    const LIMITE_MAXIMO = 50; // o back-end não aceita mais que 50 por página
    const todos: T[] = [];
    let pagina = 1;
    let totalPaginas = 1;

    do {
        const resultado = await buscarPagina(pagina, LIMITE_MAXIMO);
        todos.push(...resultado.itens);
        totalPaginas = resultado.totalPaginas;
        pagina++;
    } while (pagina <= totalPaginas);

    return todos;
}
