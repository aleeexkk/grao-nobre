import type { Categoria } from "../entidades/Categoria";
import { ErroConflito } from "../erros/ErroConflito";
import type { CategoriaRegistro, ICategoriaRepositorio } from "../repositorios/ICategoriaRepositorio";
import type { Pagina } from "../tipos/Pagina";

// Repositório "de mentira" que guarda as categorias na memória (só pros testes).
// Cumpre o MESMO contrato do repositório de verdade, então o resto do sistema nem percebe a troca.
export class CategoriaRepositorioMemoria implements ICategoriaRepositorio {
    private registros = new Map<number, CategoriaRegistro>();
    private proximoId = 1;

    // O banco não aceita dois nomes iguais (sem diferenciar maiúscula/minúscula): aqui também não
    private nomeEmUso(nome: string, ignorarId: number | null = null): boolean {
        return [...this.registros.values()].some(
            (r) => r.id !== ignorarId && r.nome.toLowerCase() === nome.toLowerCase()
        );
    }

    async inserir(categoria: Categoria): Promise<CategoriaRegistro> {
        if (this.nomeEmUso(categoria.nome)) {
            throw new ErroConflito("Já existe uma categoria com esse nome.");
        }
        const registro = { id: this.proximoId++, nome: categoria.nome, descricao: categoria.descricao };
        this.registros.set(registro.id, registro);
        return registro;
    }

    async listar(pagina: number, limite: number): Promise<Pagina<CategoriaRegistro>> {
        const todos = [...this.registros.values()]; // já está na ordem de criação (= ordem do id)
        return {
            itens: todos.slice((pagina - 1) * limite, pagina * limite),
            pagina,
            limite,
            total: todos.length,
            totalPaginas: Math.ceil(todos.length / limite),
        };
    }

    async buscarPorId(id: number): Promise<CategoriaRegistro | null> {
        return this.registros.get(id) ?? null;
    }

    async atualizar(id: number, categoria: Categoria): Promise<CategoriaRegistro | null> {
        if (!this.registros.has(id)) return null;
        if (this.nomeEmUso(categoria.nome, id)) {
            throw new ErroConflito("Já existe uma categoria com esse nome.");
        }
        const registro = { id, nome: categoria.nome, descricao: categoria.descricao };
        this.registros.set(id, registro);
        return registro;
    }

    async excluir(id: number): Promise<boolean> {
        return this.registros.delete(id);
    }
}