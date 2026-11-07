import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";
import type { IRepositorioCrud } from "../repositorios/IRepositorioCrud";
import type { Filtros } from "../tipos/Filtros";
import type { Pagina } from "../tipos/Pagina";

// Classe ABSTRATA com as regras que TODO CRUD do sistema repete (escritas uma vez só):
// "se não existe, é 404" e "valida antes de salvar".
//   TDados    = o formato dos dados que chegam do front-end (ex: DadosCategoria)
//   TEntidade = a classe que valida os dados (ex: Categoria)
//   TRegistro = como o dado aparece depois de salvo/lido (ex: CategoriaRegistro)
export abstract class ServicoCrudBase<TDados, TEntidade, TRegistro> {
    protected repositorio: IRepositorioCrud<TEntidade, TRegistro>;

    // Recebe o repositório "de fora" (pelo CONTRATO, não pelo MySQL): dá pra trocar ou testar
    constructor(repositorio: IRepositorioCrud<TEntidade, TRegistro>) {
        this.repositorio = repositorio;
    }

    // ---- O que cada filha É OBRIGADA a informar ----
    // Mensagem do erro 404 (muda por causa do gênero: "Categoria não encontrada." / "Produto não encontrado.")
    protected abstract readonly mensagemNaoEncontrado: string;

    // Transforma os dados crus na entidade. Se algum dado for inválido, a entidade lança ErroValidacao
    protected abstract criarEntidade(dados: TDados): TEntidade;

    // ---- Ganchos opcionais: regras de negócio EXTRAS ----
    // Por padrão não fazem nada. Uma filha pode sobrescrever pra acrescentar regras que só ela tem
    // (ex: o produto confere se a categoria existe; o item só entra em pedido aberto).

    // Roda depois de validar e antes de salvar. "id" é null ao CRIAR e o id do registro ao EDITAR.
    protected async verificarRegras(_entidade: TEntidade, _id: number | null): Promise<void> {}

    // Roda antes de apagar (ex: pedido pago não pode ser excluído)
    protected async verificarExclusao(_id: number): Promise<void> {}

    // ---- O que já vem PRONTO pra todas as filhas ----

    async criar(dados: TDados): Promise<TRegistro> {
        const entidade = this.criarEntidade(dados); // 1) valida (400 se inválido)
        await this.verificarRegras(entidade, null); // 2) regras extras da filha (se tiver)
        return this.repositorio.inserir(entidade); // 3) salva (409 se repetido, vem do repositório)
    }

    async listar(pagina: number, limite: number, filtros?: Filtros): Promise<Pagina<TRegistro>> {
        return this.repositorio.listar(pagina, limite, filtros);
    }

    async buscar(id: number): Promise<TRegistro> {
        const registro = await this.repositorio.buscarPorId(id);
        if (registro === null) {
            throw new ErroNaoEncontrado(this.mensagemNaoEncontrado); // 404
        }
        return registro;
    }

    async atualizar(id: number, dados: TDados): Promise<TRegistro> {
        const entidade = this.criarEntidade(dados); // 1) valida (400 se inválido)
        await this.verificarRegras(entidade, id); // 2) regras extras da filha (se tiver)
        const registro = await this.repositorio.atualizar(id, entidade); // 3) salva
        if (registro === null) {
            throw new ErroNaoEncontrado(this.mensagemNaoEncontrado); // 404: o id não existe
        }
        return registro;
    }

    async excluir(id: number): Promise<void> {
        await this.verificarExclusao(id); // regras extras da filha (se tiver)
        const apagou = await this.repositorio.excluir(id);
        if (!apagou) {
            throw new ErroNaoEncontrado(this.mensagemNaoEncontrado); // 404: não tinha o que apagar
        }
    }
}
