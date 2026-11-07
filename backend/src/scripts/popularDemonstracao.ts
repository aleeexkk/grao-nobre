import { pool } from "../config/conexao";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Popula o banco com dados de DEMONSTRAÇÃO: um cardápio de exemplo e ~30 dias de pedidos PAGOS.
// Serve pra o painel de estatísticas ter o que mostrar sem precisar cadastrar pedido por pedido.
// Como usar (com o MySQL ligado):  npm run seed
//
// É seguro: só roda se NÃO existir nenhum pedido ainda (não duplica nada) e faz tudo dentro de uma
// TRANSAÇÃO (ou entra tudo, ou, se algo der errado, não entra nada).

interface ProdutoDemo {
    nome: string;
    categoria: string;
    preco: number;
    popularidade: number; // quanto maior, mais vezes entra nos pedidos
}

const CARDAPIO: ProdutoDemo[] = [
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

const DIAS = 30;

// "Sorteador" com semente fixa: rodando de novo sempre sai a mesma sequência de números entre 0 e 1
let estado = 42;
function aleatorio(): number {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
}

// Escolhe um item da lista, dando mais chance a quem tem peso maior
function escolherPonderado<T>(itens: readonly T[], peso: (item: T) => number): T {
    const total = itens.reduce((soma, item) => soma + peso(item), 0);
    let sorteio = aleatorio() * total;
    for (const item of itens) {
        sorteio -= peso(item);
        if (sorteio < 0) return item;
    }
    return itens[itens.length - 1]!;
}

const dois = (n: number) => String(n).padStart(2, "0");

async function popular(): Promise<void> {
    // 1) Precisa existir pelo menos um usuário (todo pedido é registrado por alguém)
    const [usuarios] = await pool.query<RowDataPacket[]>("SELECT id_usuario FROM usuario ORDER BY id_usuario LIMIT 1");
    if (usuarios.length === 0) {
        console.log("Nenhum usuário cadastrado. Cadastre um pelo site (tela de cadastro) e rode de novo.");
        process.exitCode = 1;
        return;
    }
    const idUsuario = Number(usuarios[0]?.id_usuario);

    // 2) Se já tem pedido, não faz nada (evita duplicar a demonstração)
    const [contagem] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM pedido");
    if (Number(contagem[0]?.total ?? 0) > 0) {
        console.log("O banco já tem pedidos. Nada foi inserido (pra não duplicar).");
        return;
    }

    const conexao = await pool.getConnection();
    try {
        await conexao.beginTransaction();

        // 3) Categorias e produtos: INSERT IGNORE pula os que já existem (nome é UNIQUE)
        const idCategoria = new Map<string, number>();
        for (const nome of new Set(CARDAPIO.map((p) => p.categoria))) {
            await conexao.execute("INSERT IGNORE INTO categoria (nome) VALUES (?)", [nome]);
            const [linhas] = await conexao.execute<RowDataPacket[]>("SELECT id_categoria FROM categoria WHERE nome = ?", [nome]);
            idCategoria.set(nome, Number(linhas[0]?.id_categoria));
        }

        const produtos: Array<{ id: number; preco: number; popularidade: number }> = [];
        for (const produto of CARDAPIO) {
            const categoria = idCategoria.get(produto.categoria);
            if (categoria === undefined) {
                throw new Error(`Categoria "${produto.categoria}" não encontrada.`); // não deveria acontecer
            }
            await conexao.execute("INSERT IGNORE INTO produto (nome, preco, id_categoria) VALUES (?, ?, ?)", [
                produto.nome,
                produto.preco,
                categoria,
            ]);
            // Lê de volta (o produto pode já existir com outro preço: vale o que está no banco)
            const [linhas] = await conexao.execute<RowDataPacket[]>("SELECT id_produto, preco FROM produto WHERE nome = ?", [produto.nome]);
            produtos.push({ id: Number(linhas[0]?.id_produto), preco: Number(linhas[0]?.preco), popularidade: produto.popularidade });
        }

        // 4) Pedidos pagos dos últimos 30 dias (de ontem pra trás)
        let totalPedidos = 0;
        let totalItens = 0;
        for (let atras = DIAS; atras >= 1; atras--) {
            const dia = new Date();
            dia.setDate(dia.getDate() - atras);
            const fimDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
            const dataTexto = `${dia.getFullYear()}-${dois(dia.getMonth() + 1)}-${dois(dia.getDate())}`;

            // Quantidade de pedidos do dia: base + variação + bônus de fim de semana
            const quantidadePedidos = 15 + Math.floor(aleatorio() * 12) + (fimDeSemana ? 12 : 0);

            for (let i = 0; i < quantidadePedidos; i++) {
                const hora = escolherPonderado(HORARIOS, (h) => h.peso).hora;
                const minuto = Math.floor(aleatorio() * 60);
                const dataHora = `${dataTexto} ${dois(hora)}:${dois(minuto)}:${dois(Math.floor(aleatorio() * 60))}`;

                const [pedido] = await conexao.execute<ResultSetHeader>(
                    "INSERT INTO pedido (id_usuario, cliente, status, data_hora) VALUES (?, NULL, 'pago', ?)",
                    [idUsuario, dataHora]
                );

                // De 1 a 3 produtos DIFERENTES por pedido (o mesmo produto só entra uma vez), 1 a 3 unidades de cada
                const quantidadeProdutos = 1 + Math.floor(aleatorio() * 3);
                const disponiveis = [...produtos];
                const linhasItens: Array<[number, number, number, number]> = [];
                for (let k = 0; k < quantidadeProdutos && disponiveis.length > 0; k++) {
                    const escolhido = escolherPonderado(disponiveis, (p) => p.popularidade);
                    disponiveis.splice(disponiveis.indexOf(escolhido), 1);
                    linhasItens.push([pedido.insertId, escolhido.id, 1 + Math.floor(aleatorio() * 3), escolhido.preco]);
                }
                await conexao.query("INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario) VALUES ?", [linhasItens]);

                totalPedidos++;
                totalItens += linhasItens.length;
            }
        }

        await conexao.commit();
        console.log(`Pronto! Foram inseridos ${CARDAPIO.length} produtos de exemplo (os que ainda não existiam), ${totalPedidos} pedidos pagos e ${totalItens} itens, nos últimos ${DIAS} dias.`);
    } catch (erro) {
        await conexao.rollback(); // deu erro: desfaz tudo, o banco fica como estava
        throw erro;
    } finally {
        conexao.release();
    }
}

popular()
    .catch((erro: unknown) => {
        console.error("Não foi possível popular o banco:", erro instanceof Error ? erro.message : erro);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
