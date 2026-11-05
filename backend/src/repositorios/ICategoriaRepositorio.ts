import type { Categoria } from "../entidades/Categoria";
import type { IRepositorioCrud } from "./IRepositorioCrud";

// Como a categoria aparece quando é LIDA do banco
export interface CategoriaRegistro {
    id: number;
    nome: string;
    descricao: string | null;
}

// Contrato do repositório de categorias: é o CRUD genérico "preenchido" com os tipos da categoria.
// Por enquanto não precisa de nada além do básico (se precisar, é só acrescentar métodos aqui).
export interface ICategoriaRepositorio extends IRepositorioCrud<Categoria, CategoriaRegistro> {}