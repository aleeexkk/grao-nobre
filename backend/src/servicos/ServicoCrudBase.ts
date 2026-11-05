import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";
import type { IRepositorioCrud } from "../repositorios/IRepositorioCrud";
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

    // ---- O que já vem PRONTO pra todas as filhas ----

    async criar(dados: TDados): Promise<TRegistro> {
        const entidade = this.criarEntidade(dados); // 1) valida (400 se inválido)
        return this.repositorio.inserir(entidade); // 2) salva (409 se repetido, vem do repositório)
    }

    async listar(pagina: number, limite: number): Promise<Pagina<TRegistro>> {
        return this.repositorio.listar(pagina, limite);
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
        const registro = await this.repositorio.atualizar(id, entidade); // 2) salva
        if (registro === null) {
            throw new ErroNaoEncontrado(this.mensagemNaoEncontrado); // 404: o id não existe
        }
        return registro;
    }

    async excluir(id: number): Promise<void> {
        const apagou = await this.repositorio.excluir(id);
        if (!apagou) {
            throw new ErroNaoEncontrado(this.mensagemNaoEncontrado); // 404: não tinha o que apagar
        }
    }
}