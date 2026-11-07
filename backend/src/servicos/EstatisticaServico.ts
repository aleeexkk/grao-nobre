import type { IEstatisticaRepositorio, VendaRegistro } from "../repositorios/IEstatisticaRepositorio";

// Serviço das estatísticas: entrega as vendas reais pro painel.
// As contas (média, mediana, desvio padrão, regressão) ficam no front-end, em cima destes dados.
export class EstatisticaServico {
    private repositorio: IEstatisticaRepositorio;

    constructor(repositorio: IEstatisticaRepositorio) {
        this.repositorio = repositorio;
    }

    async vendas(dias: number): Promise<VendaRegistro[]> {
        return this.repositorio.listarVendas(dias);
    }
}
