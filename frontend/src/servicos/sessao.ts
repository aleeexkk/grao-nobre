// Guarda o token (o "crachá" do login) no localStorage, que fica no navegador mesmo se a aba fechar.
// Tudo dentro de try/catch porque o navegador pode bloquear o localStorage (janela anônima, por exemplo):
// nesse caso o site continua funcionando, só não lembra o login depois de recarregar.
const CHAVE_TOKEN = "grao-nobre:token";

export function salvarToken(token: string): void {
    try {
        localStorage.setItem(CHAVE_TOKEN, token);
    } catch {
        // sem localStorage: segue sem guardar
    }
}

export function lerToken(): string | null {
    try {
        return localStorage.getItem(CHAVE_TOKEN);
    } catch {
        return null;
    }
}

export function limparToken(): void {
    try {
        localStorage.removeItem(CHAVE_TOKEN);
    } catch {
        // sem localStorage: nada pra limpar
    }
}
