import { Produto } from "../entidades/Produto";
import { ErroValidacao } from "../erros/ErroValidacao";
import type { ICategoriaRepositorio } from "../repositorios/ICategoriaRepositorio";
import type { IProdutoRepositorio, ProdutoRegistro } from "../repositorios/IProdutoRepositorio";
import { ServicoCrudBase } from "./ServicoCrudBase";

// Formato dos dados que chegam do front-end (criar e editar usam o mesmo)
export interface DadosProduto {
    nome: string;
    descricao: string | null; // opcional: null = sem descrição
    preco: number;
    idCategoria: number;
}

// Classe FILHA: criar, listar, buscar, atualizar e excluir já vêm da base.
// Aqui ficam só os detalhes do produto e a regra "a categoria precisa existir".
export class ProdutoServico extends ServicoCrudBase<DadosProduto, Produto, ProdutoRegistro> {
    protected readonly mensagemNaoEncontrado = "Produto não encontrado.";

    // Pedimos SÓ o que vamos usar das categorias (buscarPorId), e não o contrato inteiro.
    // Quanto menos a classe exige, mais fácil de trocar e de testar (princípio da segregação de interfaces)
    private categorias: Pick<ICategoriaRepositorio, "buscarPorId">;

    constructor(repositorio: IProdutoRepositorio, categorias: Pick<ICategoriaRepositorio, "buscarPorId">) {
        super(repositorio); // entrega o repositório de produtos pra classe base
        this.categorias = categorias;
    }

    // Cria o Produto: é ELE que valida nome, descrição, preço e id da categoria
    protected criarEntidade(dados: DadosProduto): Produto {
        return new Produto(dados.nome, dados.descricao, dados.preco, dados.idCategoria);
    }

    // Regra extra do produto: a categoria informada precisa existir
    protected override async verificarRegras(produto: Produto): Promise<void> {
        const categoria = await this.categorias.buscarPorId(produto.idCategoria);
        if (categoria === null) {
            throw new ErroValidacao("A categoria informada não existe.");
        }
    }
}
