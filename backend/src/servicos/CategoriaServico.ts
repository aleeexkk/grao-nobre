import { Categoria } from "../entidades/Categoria";
import type { CategoriaRegistro } from "../repositorios/ICategoriaRepositorio";
import { ServicoCrudBase } from "./ServicoCrudBase";

// Formato dos dados que chegam do front-end (criar e editar usam o mesmo)
export interface DadosCategoria {
    nome: string;
    descricao: string | null; // opcional: null = sem descrição
}

// Classe FILHA: criar, listar, buscar, atualizar e excluir já vêm da base.
// Aqui só dizemos o que é específico da categoria.
export class CategoriaServico extends ServicoCrudBase<DadosCategoria, Categoria, CategoriaRegistro> {
    protected readonly mensagemNaoEncontrado = "Categoria não encontrada.";

    // Cria a Categoria: é ELA que valida nome e descrição (lança ErroValidacao se estiver errado)
    protected criarEntidade(dados: DadosCategoria): Categoria {
        return new Categoria(dados.nome, dados.descricao);
    }
}