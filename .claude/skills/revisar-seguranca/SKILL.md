---
name: revisar-seguranca
description: Revisa a segurança do código do Grão Nobre (SQL injection, segredos, rotas sem login, validação, senhas, erros que vazam informação). Use ao terminar uma funcionalidade ou quando o autor pedir uma revisão.
---

# Revisão de segurança

Leia o código (não adivinhe) e responda cada item com **ok** ou **problema** + arquivo e linha. Não altere nada sem o autor aprovar,
a não ser que a correção seja óbvia e pequena (aí avise o que mudou). Nunca abra o `.env`: confira só o `.env.example` e o `.gitignore`.

## Back-end

1. **SQL injection**: procure todo `pool.query` e `pool.execute` (`grep -rn "pool\.\(query\|execute\)" backend/src`).
   Valor vindo do usuário só pode entrar por `?`. Template string com `${}` dentro de SQL só é aceitável para nome de tabela/coluna escrito no código.
2. **Autenticação**: toda rota de dados passa por `autenticar` (as públicas são só cadastro e login). Em `app.ts`, confira cada `app.use`.
3. **Autorização**: usuário só altera o próprio cadastro; o dono do pedido vem do token (`usuarioLogado`), não do corpo.
4. **Validação**: toda entrada passa por entidade ou por `validadores/corpo.ts` antes de chegar ao banco. Tamanhos batem com as colunas do SQL.
5. **Senhas**: salvas com bcrypt; o hash nunca aparece em resposta de API, log ou teste.
6. **Segredos**: `JWT_SECRET` e dados do banco vêm de variável de ambiente; nada fixo no código.
   O `.gitignore` ignora `.env` e `.env.*` (exceto `.env.example`).
7. **Erros**: o `tratadorErros` devolve mensagem amigável para erros conhecidos e uma mensagem genérica para os inesperados (sem stack trace nem SQL).
8. **Limites**: paginação com `limite` máximo, filtros só os aceitos pela rota, `dias` das estatísticas limitado.

## Front-end

9. Sem `dangerouslySetInnerHTML` nem `eval`. Dados exibidos passam pelo React (que escapa o texto).
10. O token fica no `localStorage` (risco conhecido de XSS, aceito neste projeto); sessão vencida (401) limpa o token e volta ao login.
11. Nenhuma chave ou senha dentro de `frontend/src` nem em variável `VITE_*` (tudo que é `VITE_*` vai pro navegador).

## Docker

12. `docker-compose.yml` lê as senhas do `.env` da raiz (que não vai pro Git); o banco só é publicado em `127.0.0.1`.

## Resultado

Entregue uma tabela curta: item, ok/problema, onde, sugestão de correção. Termine dizendo o que ficou **sem verificar**.
