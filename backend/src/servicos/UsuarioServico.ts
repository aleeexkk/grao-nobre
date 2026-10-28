import bcrypt from "bcryptjs";
import { Usuario } from "../entidades/Usuario";
import { UsuarioRepositorio } from "../repositorios/UsuarioRepositorio";
import { ErroConflito } from "../erros/ErroConflito";

// Formato dos dados que chegam do front-end no cadastro
export interface DadosCadastro {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
}

// Formato do que devolvemos depois de cadastrar (sem a senha, nunca!)
export interface UsuarioCadastrado {
    id: number;
    nome: string;
    email: string;
}

// Classe com as regras de negócio do usuário
export class UsuarioServico {
    private repositorio: UsuarioRepositorio;

    // Recebe o repositório "de fora" (assim dá pra trocar ou testar sem mexer aqui)
    constructor(repositorio: UsuarioRepositorio) {
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
}