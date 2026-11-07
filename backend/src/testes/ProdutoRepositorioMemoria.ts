import type { Produto } from "../entidades/Produto";
import { ErroConflito } from "../erros/ErroConflito";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { ICategoriaRepositorio } from "../repositorios/ICategoriaRepositorio";
import type { IProdutoRepositorio, ProdutoRegistro } from "../repositorios/IProdutoRepositorio";
import type { Pagina } from "../tipos/Pagina";

// Repositório "de mentira" que guarda os produtos na memória (só pros testes).
// Imita o banco: nome único, categoria precisa existir e o nome da categoria vem junto (o "JOIN").
export class ProdutoRepositorioMemoria implements IProdutoRepositorio {
    private registros = new Map<number, Omit<ProdutoRegistro, "categoria">>();
    private proximoId = 1;
    private categorias: ICategoriaRepositorio;

    constructor(categorias: ICategoriaRepositorio) {
        this.categorias = categorias;
    }

    // Monta o registro completo, buscando o nome da categoria (o "JOIN" de mentira)
    private async completar(registro: Omit<ProdutoRegistro, "categoria">): Promise<ProdutoRegistro> {
        const categoria = await this.categorias.buscarPorId(registro.idCategoria);
        return { ...registro, categoria: categoria?.nome ?? "" };
    }

    private async conferirRegras(produto: Produto, ignorarId: number | null): Promise<void> {
        if ((await this.categorias.buscarPorId(produto.idCategoria)) === null) {
            throw new ErroValidacao("A categoria informada não existe.");
        }
        const repetido = [...this.registros.values()].some(
            (r) => r.id !== ignorarId && r.nome.toLowerCase() === produto.nome.toLowerCase()
        );
        if (repetido) {
            throw new ErroConflito("Já existe um produto com esse nome.");
        }
    }

    async inserir(produto: Produto): Promise<ProdutoRegistro> {
        await this.conferirRegras(produto, null);
        const registro = {
            id: this.proximoId++,
            nome: produto.nome,
            descricao: produto.descricao,
            preco: produto.preco,
            idCategoria: produto.idCategoria,
        };
        this.registros.set(registro.id, registro);
        return this.completar(registro);
    }

    async listar(pagina: number, limite: number): Promise<Pagina<ProdutoRegistro>> {
        const todos = [...this.registros.values()];
        const itens = await Promise.all(todos.slice((pagina - 1) * limite, pagina * limite).map((r) => this.completar(r)));
        return { itens, pagina, limite, total: todos.length, totalPaginas: Math.ceil(todos.length / limite) };
    }

    async buscarPorId(id: number): Promise<ProdutoRegistro | null> {
        const registro = this.registros.get(id);
        return registro ? this.completar(registro) : null;
    }

    async atualizar(id: number, produto: Produto): Promise<ProdutoRegistro | null> {
        if (!this.registros.has(id)) return null;
        await this.conferirRegras(produto, id);
        const registro = {
            id,
            nome: produto.nome,
            descricao: produto.descricao,
            preco: produto.preco,
            idCategoria: produto.idCategoria,
        };
        this.registros.set(id, registro);
        return this.completar(registro);
    }

    async excluir(id: number): Promise<boolean> {
        return this.registros.delete(id);
    }
}
