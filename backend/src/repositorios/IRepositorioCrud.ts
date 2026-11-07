import type { Filtros } from "../tipos/Filtros";
import type { Pagina } from "../tipos/Pagina";

// Contrato GENÉRICO de um CRUD (Create, Read, Update, Delete).
// Diz O QUE todo repositório do sistema sabe fazer, sem dizer COMO (MySQL, memória, etc).
//   TEntidade = a classe que valida os dados (ex: Categoria)
//   TRegistro = como o dado aparece quando é lido do banco (ex: CategoriaRegistro)
export interface IRepositorioCrud<TEntidade, TRegistro> {
    // Create: salva e devolve o registro já com o id que o banco gerou
    inserir(entidade: TEntidade): Promise<TRegistro>;

    // Read: lista com paginação (pagina começa em 1). Os filtros são opcionais
    // (ex: só os itens de um pedido) e cada repositório decide quais aceita.
    listar(pagina: number, limite: number, filtros?: Filtros): Promise<Pagina<TRegistro>>;

    // Read: busca um só. Devolve null se não existir
    buscarPorId(id: number): Promise<TRegistro | null>;

    // Update: altera e devolve o registro atualizado. Devolve null se o id não existir
    atualizar(id: number, entidade: TEntidade): Promise<TRegistro | null>;

    // Delete: apaga. Devolve true se apagou, false se o id não existia
    excluir(id: number): Promise<boolean>;
}
