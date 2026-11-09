import bcrypt from "bcryptjs";
import { Usuario } from "../entidades/Usuario";
import type { IUsuarioRepositorio } from "../repositorios/IUsuarioRepositorio";
import { ErroConflito } from "../erros/ErroConflito";
import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";
import { ErroProibido } from "../erros/ErroProibido";
import { ErroValidacao } from "../erros/ErroValidacao";

// Formato dos dados que chegam do front-end no cadastro
export interface DadosCadastro {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
}

// Formato dos dados que chegam do front-end na edição.
// Todos os campos são obrigatórios. O e-mail vem junto, mas precisa ser igual ao atual (e-mail não pode ser alterado)
export interface DadosEdicao {
    nome: string;
    email: string;
    cpf: string;
    senha: string;
}

// Formato do que devolvemos depois de cadastrar (sem a senha, nunca!)
export interface UsuarioCadastrado {
    id: number;
    nome: string;
    email: string;
}

// Formato do perfil do usuário logado (também sem a senha)
export interface PerfilUsuario {
    id: number;
    nome: string;
    email: string;
    cpf: string;
}

// Classe com as regras de negócio do usuário
export class UsuarioServico {
    private repositorio: IUsuarioRepositorio;

    // Recebe o repositório "de fora" (assim dá pra trocar ou testar sem mexer aqui)
    constructor(repositorio: IUsuarioRepositorio) {
        this.repositorio = repositorio;
    }

    async cadastrar(dados: DadosCadastro): Promise<UsuarioCadastrado> {
        // 1) Cria o Usuario: se algum dado for inválido, já lança ErroValidacao aqui
        const usuario = new Usuario(dados.nome, dados.email, dados.senha, dados.cpf);

        // 2) Barra duplicados (usa o e-mail e o CPF já tratados pela classe)
        if (await this.repositorio.existeEmail(usuario.email)) {
            throw new ErroConflito("E-mail já cadastrado.");
        }
        if (await this.repositorio.existeCpf(usuario.cpf)) {
            throw new ErroConflito("CPF já cadastrado.");
        }

        // 3) Criptografa a senha (10 = quantas "voltas" de mistura, mais voltas = mais seguro e mais lento)
        const senhaHash = await bcrypt.hash(dados.senha, 10);

        // 4) Salva no banco e devolve só o que pode aparecer
        const id = await this.repositorio.inserir(usuario, senhaHash);
        return { id, nome: usuario.nome, email: usuario.email };
    }

    // Devolve o perfil de um usuário (usado pra mostrar os dados do usuário logado)
    async buscarPerfil(id: number): Promise<PerfilUsuario> {
        const registro = await this.repositorio.buscarPorId(id);
        if (registro === null) {
            throw new ErroNaoEncontrado("Usuário não encontrado.");
        }
        return { id: registro.id, nome: registro.nome, email: registro.email, cpf: registro.cpf };
    }

    // Edita o usuário. idLogado = quem está logado (vem do token); idAlvo = quem se quer editar
    async atualizar(idLogado: number, idAlvo: number, dados: DadosEdicao): Promise<PerfilUsuario> {
        // 1) Cada pessoa só edita o PRÓPRIO usuário
        if (idLogado !== idAlvo) {
            throw new ErroProibido("Você só pode editar o seu próprio usuário.");
        }

        // 2) O usuário precisa existir
        const atual = await this.repositorio.buscarPorId(idAlvo);
        if (atual === null) {
            throw new ErroNaoEncontrado("Usuário não encontrado.");
        }

        // 3) O e-mail não pode mudar (tem que ser o mesmo de sempre)
        if (dados.email.trim().toLowerCase() !== atual.email) {
            throw new ErroValidacao("Não é permitido alterar o e-mail.");
        }

        // 4) Valida tudo de novo com a mesma classe do cadastro (nome, CPF e nível da senha)
        const usuario = new Usuario(dados.nome, atual.email, dados.senha, dados.cpf, atual.id);

        // 5) O CPF novo não pode ser de outra pessoa
        if (await this.repositorio.existeCpfDeOutro(usuario.cpf, atual.id)) {
            throw new ErroConflito("CPF já cadastrado.");
        }

        // 6) Criptografa a senha nova e salva
        const senhaHash = await bcrypt.hash(dados.senha, 10);
        await this.repositorio.atualizar(atual.id, usuario, senhaHash);

        return { id: atual.id, nome: usuario.nome, email: atual.email, cpf: usuario.cpf };
    }
}
