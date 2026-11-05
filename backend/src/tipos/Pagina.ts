// Uma "página" de resultados: os itens daquela página + os números pra montar a paginação.
// O <T> é um "espaço em branco": Pagina<Categoria> é uma página de categorias,
// Pagina<Produto> é uma página de produtos... Um tipo só serve pra todo mundo.
export interface Pagina<T> {
    itens: T[]; // o que veio nesta página
    pagina: number; // número da página atual (começa em 1)
    limite: number; // quantos itens cabem por página
    total: number; // quantos itens existem no total (todas as páginas)
    totalPaginas: number; // quantas páginas existem
}