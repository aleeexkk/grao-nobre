import type { Usuario } from "../entidades/Usuario";
import { ErroConflito } from "../erros/ErroConflito";
import type { IUsuarioRepositorio, UsuarioRegistro } from "../repositorios/IUsuarioRepositorio";

// Repositório "de mentira" que guarda tudo na memória (usado só nos testes, sem precisar de banco).
// Ele respeita o MESMO contrato do repositório de verdade (IUsuarioRepositorio),
// então os serviços funcionam igual com um ou com o outro.
export class UsuarioRepositorioMemoria implements IUsuarioRepositorio {
    private registros: UsuarioRegistro[] = [];
    private proximoId = 1;

    async inserir(usuario: Usuario, senhaHash: string): Promise<number> {
        // Imita as colunas UNIQUE do banco
        if (this.registros.some((r) => r.email === usuario.email || r.cpf === usuario.cpf)) {
            throw new ErroConflito("E-mail ou CPF já cadastrado.");
        }
        const id = this.proximoId++;
        this.registros.push({ id, nome: usuario.nome, email: usuario.email, cpf: usuario.cpf, senhaHash });
        return id;
    }

    async existeEmail(email: string): Promise<boolean> {
        return this.registros.some((r) => r.email === email);
    }

    async existeCpf(cpf: string): Promise<boolean> {
        return this.registros.some((r) => r.cpf === cpf);
    }

    async existeCpfDeOutro(cpf: string, idAtual: number): Promise<boolean> {
        return this.registros.some((r) => r.cpf === cpf && r.id !== idAtual);
    }

    async buscarPorEmail(email: string): Promise<UsuarioRegistro | null> {
        return this.registros.find((r) => r.email === email) ?? null;
    }

    async buscarPorId(id: number): Promise<UsuarioRegistro | null> {
        return this.registros.find((r) => r.id === id) ?? null;
    }

    async atualizar(id: number, usuario: Usuario, senhaHash: string): Promise<void> {
        const registro = this.registros.find((r) => r.id === id);
        if (registro) {
            registro.nome = usuario.nome;
            registro.cpf = usuario.cpf;
            registro.senhaHash = senhaHash;
        }
    }

    // Só pros testes conferirem o que ficou guardado (ex: se a senha está em hash)
    todos(): readonly UsuarioRegistro[] {
        return this.registros;
    }
}
