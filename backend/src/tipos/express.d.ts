// Ensina o TypeScript que, depois do middleware de autenticação, a requisição carrega
// "usuarioAutenticado" (quem está logado, lido do token)
declare global {
    namespace Express {
        interface Request {
            usuarioAutenticado?: { id: number; email: string };
        }
    }
}

export {};
