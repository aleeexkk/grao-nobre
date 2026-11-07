import type { Produto } from "../entidades/Produto";
import type { IRepositorioCrud } from "./IRepositorioCrud";

// Como o produto aparece quando é LIDO do banco
export interface ProdutoRegistro {
    id: number;
    nome: string;
    descricao: string | null;
    preco: number;
    idCategoria: number;
    categoria: string; // nome da categoria (vem do JOIN, só pra mostrar na tela)
}

// Contrato do repositório de produtos: o CRUD genérico "preenchido" com os tipos do produto
export interface IProdutoRepositorio extends IRepositorioCrud<Produto, ProdutoRegistro> {}
