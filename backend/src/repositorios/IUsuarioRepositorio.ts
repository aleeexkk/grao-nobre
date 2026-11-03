import type { Usuario } from "../entidades/Usuario";

// Como o usuário aparece quando é LIDO do banco (já com a senha em hash, nunca a senha pura)
export interface UsuarioRegistro {
    id: number;
    nome: string;
    email: string;
    cpf: string;
    senhaHash: string;
}

// "Contrato" do repositório: diz O QUE ele sabe fazer, sem dizer COMO.
// Os serviços dependem deste contrato (e não do MySQL): dá pra trocar o banco, ou usar um
// repositório de mentira nos testes, sem mexer em nenhuma regra de negócio.
export interface IUsuarioRepositorio {
    inserir(usuario: Usuario, senhaHash: string): Promise<number>;
    existeEmail(email: string): Promise<boolean>;
    existeCpf(cpf: string): Promise<boolean>;
    existeCpfDeOutro(cpf: string, idAtual: number): Promise<boolean>;
    buscarPorEmail(email: string): Promise<UsuarioRegistro | null>;
    buscarPorId(id: number): Promise<UsuarioRegistro | null>;
    atualizar(id: number, usuario: Usuario, senhaHash: string): Promise<void>;
}
