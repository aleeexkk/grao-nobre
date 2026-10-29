// Formato de cada linha de venda
export interface Venda {
    id: number;
    data: string; // "2026-10-01" (ano-mês-dia)
    hora: number; // hora do dia em que a venda aconteceu (7 a 19)
    produto: string;
    categoria: string;
    quantidade: number;
    valorUnitario: number;
}

interface ProdutoCardapio {
    nome: string;
    categoria: string;
    preco: number;
    popularidade: number; // quanto maior, mais vezes é sorteado
}

const CARDAPIO: ProdutoCardapio[] = [
    { nome: "Café expresso", categoria: "Bebidas", preco: 6, popularidade: 30 },
    { nome: "Cappuccino", categoria: "Bebidas", preco: 9, popularidade: 20 },
    { nome: "Suco natural", categoria: "Bebidas", preco: 8, popularidade: 8 },
    { nome: "Pão de queijo", categoria: "Salgados", preco: 5, popularidade: 25 },
    { nome: "Pão na chapa", categoria: "Salgados", preco: 7, popularidade: 18 },
    { nome: "Coxinha", categoria: "Salgados", preco: 8, popularidade: 15 },
    { nome: "Bolo de cenoura", categoria: "Doces", preco: 10, popularidade: 12 },
    { nome: "Brigadeiro", categoria: "Doces", preco: 4, popularidade: 10 },
];

// Peso de cada horário: picos às 8h (café da manhã) e às 15h (café da tarde)
const HORARIOS = [
    { hora: 7, peso: 5 },
    { hora: 8, peso: 14 },
    { hora: 9, peso: 12 },
    { hora: 10, peso: 8 },
    { hora: 11, peso: 7 },
    { hora: 12, peso: 10 },
    { hora: 13, peso: 9 },
    { hora: 14, peso: 8 },
    { hora: 15, peso: 13 },
    { hora: 16, peso: 11 },
    { hora: 17, peso: 7 },
    { hora: 18, peso: 4 },
    { hora: 19, peso: 2 },
];

// "Sorteador" com semente fixa: sempre devolve a mesma sequência de números entre 0 e 1
let estado = 42;
function aleatorio(): number {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
}

// Escolhe um item da lista, dando mais chance pra quem tem peso maior
// <T> = "serve pra qualquer tipo de item" (isso se chama Generics)
function escolherPonderado<T>(itens: T[], peso: (item: T) => number): T {
    const total = itens.reduce((soma, item) => soma + peso(item), 0);
    let sorteio = aleatorio() * total;
    for (const item of itens) {
        sorteio -= peso(item);
        if (sorteio < 0) return item;
    }
    return itens[itens.length - 1];
}

function gerarVendas(): Venda[] {
    const vendas: Venda[] = [];
    let id = 1;

    for (let dia = 0; dia < 30; dia++) {
        const data = new Date(2026, 9, 1 + dia); // mês 9 = outubro (os meses começam do 0!)
        const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado
        const fimDeSemana = diaSemana === 0 || diaSemana === 6;

        // Quantidade de vendas do dia: base + variação + bônus de fim de semana
        const qtdVendas = 20 + Math.floor(aleatorio() * 15) + (fimDeSemana ? 15 : 0);

        // Monta o texto "2026-10-01" (padStart completa com zero à esquerda)
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const diaMes = String(data.getDate()).padStart(2, "0");
        const dataTexto = `${data.getFullYear()}-${mes}-${diaMes}`;

        for (let i = 0; i < qtdVendas; i++) {
            const produto = escolherPonderado(CARDAPIO, (p) => p.popularidade);
            const horario = escolherPonderado(HORARIOS, (h) => h.peso);

            vendas.push({
                id: id++,
                data: dataTexto,
                hora: horario.hora,
                produto: produto.nome,
                categoria: produto.categoria,
                quantidade: 1 + Math.floor(aleatorio() * 3), // 1, 2 ou 3 unidades
                valorUnitario: produto.preco,
            });
        }
    }

    return vendas;
}

// Dados de exemplo (fictícios). Nas próximas sprints, virão do banco de dados.
export const VENDAS: Venda[] = gerarVendas();