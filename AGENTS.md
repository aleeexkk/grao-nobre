# AGENTS.md — Grão Nobre

Instruções para qualquer agente de IA (Claude Code, Codex, Cursor...) que mexer neste repositório.
Leia tudo antes de alterar código.

## O projeto

Sistema de gestão de uma cafeteria/padaria: login, CRUD de categorias, produtos, pedidos e itens do pedido,
e um painel de estatísticas de vendas. Projeto individual de fim de ano (Back-end, Front-end, Estatística e Tech Forge).
Autor: Alex Venâncio da Silva.

| Parte | Tecnologia |
| --- | --- |
| `backend/` | Node 22, TypeScript (strict), Express 5, mysql2, JWT, bcryptjs, testes com `node:test` |
| `frontend/` | React 19, TypeScript, Vite, react-router-dom, Recharts |
| `banco/` | MariaDB/MySQL: `grao_nobre.sql` cria o banco inteiro |

## Comandos

```bash
# Back-end (pasta backend/)
npm run dev            # sobe a API em http://localhost:3000 (precisa do .env e do MySQL ligado)
npm test               # testes (usam repositórios em memória, não precisam de banco)
npx tsc --noEmit       # checagem de tipos
npm run seed           # popula dados de demonstração (30 dias de vendas) — só roda com a tabela pedido vazia

# Front-end (pasta frontend/)
npm run dev            # site em http://localhost:5173
npm run build          # checa os tipos e gera o build

# Tudo junto, no Docker (raiz do projeto, precisa do .env da raiz)
docker compose up --build
```

## Arquitetura do back-end (Tech Forge)

Camadas, cada uma só conhece a de baixo: **rotas → serviços → repositórios → banco**.

- `entidades/`: classes com atributos privados e getters/setters que validam. Dado inválido lança `ErroValidacao` (400).
- `repositorios/`: `IRepositorioCrud<TEntidade, TRegistro>` é o contrato; `RepositorioMySqlBase` é a base abstrata
  (listar com paginação e filtros, buscar, excluir). Cada tabela estende a base e só escreve o que muda.
- `servicos/`: `ServicoCrudBase` (classe abstrata) tem as regras repetidas (404, validar antes de salvar).
  As filhas usam os ganchos `verificarRegras` e `verificarExclusao` para as regras de negócio.
- `rotas/`: `criarRotasCrud(...)` monta POST/GET/GET:id/PUT/DELETE de qualquer recurso. Todas exigem login.
- `erros/`: `ErroAplicacao` (abstrata) e as filhas por status (400, 401, 403, 404, 409). O `tratadorErros` converte em JSON.
- `testes/`: repositórios **em memória** implementam os mesmos contratos (inversão de dependência), por isso os testes
  rodam sem banco. `dependenciasDeTeste.ts` monta tudo.

No front, a mesma ideia: `servicos/crud.ts` (`criarClienteCrud`) e os componentes genéricos de `components/crud/`
(`ListaCrud`, `FormularioCrud`, `PaginaFormCrud`, `Paginacao`). Uma tela nova de CRUD só informa colunas e campos.

## Regras de negócio que os testes protegem

- Pedido nasce `aberto`. De `aberto` vai para `pago` ou `cancelado` e depois **não muda mais** (409).
- Não dá para pagar pedido sem itens (409). Pedido pago não pode ser excluído (409).
- Itens só entram, mudam ou saem de pedido `aberto` (409). Editar item muda só a quantidade.
- O mesmo produto não repete no mesmo pedido (409). O preço do item é copiado do produto no momento em que entra (não muda depois).
- Quem registrou o pedido vem do **token**, nunca do corpo da requisição.
- Produto que já foi vendido não pode ser excluído (409). Categoria com produtos também não.
- Estatística: o back-end devolve as linhas de venda (itens de pedidos **pagos**) e o front calcula média, mediana,
  desvio padrão e regressão (`frontend/src/estatisticas/metricas.ts`).

## Guardrails (o que NÃO fazer)

**Segredos e `.env`**
- Nunca ler, mostrar, copiar, resumir nem commitar `.env` (nem `backend/.env`). Eles têm senha do banco e `JWT_SECRET`.
  O arquivo `.claude/settings.json` bloqueia a leitura pelas ferramentas de arquivo, e este documento vale também
  para comandos de terminal (`cat .env`, `type .env`, `env`, `printenv`...).
- Só `.env.example` (sem valores reais) pode ser lido e versionado. Variável nova entra nele, sem valor.
- Nunca colocar senha, token ou chave dentro do código, de testes, de logs ou de mensagens de commit.

**Banco de dados**
- Todo valor que vem do usuário entra no SQL por `?` (consulta parametrizada). Proibido montar SQL com template string
  ou concatenação. Só nomes de tabela/coluna escritos no código podem ser interpolados.
- Não rodar `DROP`, `TRUNCATE`, `DELETE` sem `WHERE` nem alterar o schema no banco do autor sem pedir confirmação antes.
  Mudança de schema vai em `banco/grao_nobre.sql` (o script precisa continuar podendo rodar mais de uma vez).
- Dinheiro é `DECIMAL`, nunca `FLOAT`.

**Código**
- Sem `any`, sem `@ts-ignore`, sem `as` para "forçar" tipo. O TypeScript está em modo estrito de propósito.
- Não pular camadas (rota falando direto com o banco) e não duplicar o que a classe base já faz.
- Não instalar dependência nova sem o autor aprovar. Não mexer em `package-lock.json` à mão.
- Senha nunca volta em resposta da API. Rota nova de dados nasce atrás do `autenticar`.

**Git**
- Só commitar quando o autor pedir. Nunca `push --force`, nunca reescrever histórico já publicado.
- Mensagens no padrão do repositório: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `style:` + descrição em português.
- Não adicionar trailers automáticos de coautoria (`Co-Authored-By`) nas mensagens: foi decisão do autor.
- Antes de commitar, passar nos testes e na checagem de tipos (skill abaixo).

**Comunicação**
- Explicar em português simples o que foi feito, com comentários no código que ajudem a defender o projeto na apresentação.
- Se algo der errado ou uma regra deste arquivo atrapalhar a tarefa, parar e avisar em vez de contornar.

## Skills do projeto

Ficam em `.claude/skills/<nome>/SKILL.md` (formato de skills do Claude Code; outros agentes podem ler o arquivo como roteiro).

| Skill | Quando usar |
| --- | --- |
| [`criar-crud`](.claude/skills/criar-crud/SKILL.md) | Criar um recurso novo seguindo os padrões do projeto, do banco até a tela |
| [`qualidade-antes-do-commit`](.claude/skills/qualidade-antes-do-commit/SKILL.md) | Antes de dizer que terminou ou de commitar: tipos, testes, build e conferência do que vai no commit |
| [`revisar-seguranca`](.claude/skills/revisar-seguranca/SKILL.md) | Revisar o código procurando SQL injection, vazamento de segredo, rota sem login e validação faltando |

## Pronto significa

1. `npx tsc --noEmit` e `npm test` passando no back-end; `npm run build` passando no front.
2. Regra de negócio nova tem teste (caminho feliz e pelo menos um erro).
3. Nenhum `.env`, `node_modules` ou `dist` no commit.
4. O autor entende o que foi feito (comentários e explicação).
