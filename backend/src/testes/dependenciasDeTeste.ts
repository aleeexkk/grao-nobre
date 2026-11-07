import type { Dependencias } from "../app";
import { UsuarioServico } from "../servicos/UsuarioServico";
import { CategoriaServico } from "../servicos/CategoriaServico";
import { ProdutoServico } from "../servicos/ProdutoServico";
import { PedidoServico } from "../servicos/PedidoServico";
import { ItemPedidoServico } from "../servicos/ItemPedidoServico";
import { EstatisticaServico } from "../servicos/EstatisticaServico";
import { AutenticacaoServico } from "../servicos/AutenticacaoServico";
import type { TokenServico } from "../servicos/TokenServico";
import type { UsuarioRepositorioMemoria } from "./UsuarioRepositorioMemoria";
import { CategoriaRepositorioMemoria } from "./CategoriaRepositorioMemoria";
import { ProdutoRepositorioMemoria } from "./ProdutoRepositorioMemoria";
import { ItemPedidoRepositorioMemoria } from "./ItemPedidoRepositorioMemoria";
import { PedidoRepositorioMemoria } from "./PedidoRepositorioMemoria";
import { EstatisticaRepositorioMemoria } from "./EstatisticaRepositorioMemoria";

// Monta TODAS as peças do app com repositórios de mentira (em memória), pros testes.
// Fica num lugar só: quando entrar um CRUD novo, é só acrescentar aqui e os testes antigos nem mudam.
export function criarDependenciasDeTeste(usuarios: UsuarioRepositorioMemoria, tokens: TokenServico): Dependencias {
    const categorias = new CategoriaRepositorioMemoria();
    const produtos = new ProdutoRepositorioMemoria(categorias);
    const itens = new ItemPedidoRepositorioMemoria(produtos);
    const pedidos = new PedidoRepositorioMemoria(itens, usuarios);

    return {
        usuarioServico: new UsuarioServico(usuarios),
        categoriaServico: new CategoriaServico(categorias),
        produtoServico: new ProdutoServico(produtos, categorias),
        pedidoServico: new PedidoServico(pedidos),
        itemPedidoServico: new ItemPedidoServico(itens, pedidos, produtos),
        estatisticaServico: new EstatisticaServico(new EstatisticaRepositorioMemoria(pedidos, itens, produtos)),
        autenticacaoServico: new AutenticacaoServico(usuarios, tokens),
        tokenServico: tokens,
    };
}
