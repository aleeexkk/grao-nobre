---
name: qualidade-antes-do-commit
description: Roda a checagem de qualidade do Grão Nobre (tipos, testes, build e conferência do que vai no commit). Use antes de dizer que uma tarefa terminou ou de fazer um commit.
---

# Qualidade antes do commit

Não diga "pronto" sem ter rodado isto e visto o resultado. Mostre ao autor o que passou e o que falhou.

## 1. Back-end (pasta `backend/`)

```bash
npx tsc --noEmit    # tem que terminar sem nenhum erro
npm test            # todos os testes precisam passar (fail 0)
```

## 2. Front-end (pasta `frontend/`)

```bash
npm run build       # roda a checagem de tipos e gera o build; tem que terminar sem erro
```

`npm run lint` Não existe npm run lint: o ESLint foi removido porque não funciona com o TypeScript 7. A checagem de tipos do build (modo estrito, sem variável ou parâmetro sobrando) é a verificação do front.

## 3. Conferir o que vai no commit

```bash
git status
git diff --stat
```

- Não pode aparecer `.env`, `node_modules/` nem `dist/` (se aparecer, o `.gitignore` foi mexido: parar e avisar).
- Não pode haver arquivo de teste manual solto, `console.log` de depuração nem código comentado que ficou para trás.
- Se mexeu em `banco/grao_nobre.sql`, o script precisa rodar de novo num banco que já existe sem dar erro.

## 4. Mensagem do commit

Padrão do repositório: `tipo: descrição curta em português`, com `feat`, `fix`, `docs`, `test`, `chore` ou `style`.
Exemplos reais: `feat: CRUD de categorias no back-end`, `docs: simplifica o README`.
Um commit por assunto. Sem trailers de coautoria. Só commitar quando o autor pedir; nunca `push --force`.

## Se algo falhar

Corrija a causa (não apague nem pule o teste). Se a falha não for sua, descreva o erro completo ao autor e pare.
