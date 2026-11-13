# Grão Nobre

Sistema para cafeteria/padaria, feito como projeto de fim de ano do curso (Back-end, Front-end, Ferramentas DevOps e Tech Forge).

## Para quem é

O sistema foi pensado para o **dono de uma cafeteria ou padaria**: ele gerencia o cardápio (categorias e produtos) e os pedidos do dia e, no painel, quer ver os **horários de pico** e os **itens campeões** de venda.

## O que tem

- Cadastro, login (JWT) e edição do próprio perfil.
- CRUD de categorias, produtos e pedidos, com os itens de cada pedido. As listagens têm paginação.
- O pedido começa aberto e depois vira pago ou cancelado (e aí não muda mais). O total é calculado pelo banco e o preço do item fica guardado como era na hora da venda.
- Segurança: senha guardada com hash (bcrypt), token JWT que vence em 2 horas, trava depois de vários erros de senha, CORS restrito, limites de tamanho nos dados e cabeçalhos de segurança nas respostas.
- Painel com os números dos pedidos pagos: média, mediana, desvio padrão, ranking de produtos, horário de pico e regressão entre preço e unidades vendidas.

## Tecnologias

- Back-end: Node, TypeScript, Express, mysql2, JWT e bcrypt
- Front-end: React, TypeScript, Vite e Recharts
- Banco: MariaDB/MySQL (o script está em `banco/grao_nobre.sql`)

## Como rodar

### Sem Docker

1. Ligue o MySQL (pelo XAMPP, por exemplo) e execute o arquivo `banco/grao_nobre.sql` no DBeaver.

2. Back-end (porta 3000):

```
cd backend
copy .env.example .env
```

Abra o `.env`, confira os dados do banco e preencha o `JWT_SECRET` com um texto grande e aleatório (mínimo de 16 caracteres). Depois:

```
npm install
npm run dev
```

3. Front-end (porta 5173), em outro terminal:

```
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`, crie uma conta e entre.

Para ver o painel com dados, dá para cadastrar pedidos pelo site e marcá-los como pagos, ou usar os dados de demonstração (precisa ter uma conta criada antes e a tabela de pedidos vazia):

```
cd backend
npm run seed
```

### Com Docker

Na raiz do projeto:

```
copy .env.example .env
```

Preencha `DB_PASSWORD` e `JWT_SECRET` no `.env` e rode:

```
docker compose up --build
```

O site fica em `http://localhost:8080` e a API em `http://localhost:8080/api` (é o Nginx que encaminha). O banco é criado sozinho na primeira vez e os dados ficam num volume (`dados-banco`), então continuam lá depois de `docker compose down`. Para apagar tudo e começar de novo: `docker compose down -v`.

Como o Docker está organizado:

```
navegador ──> proxy (Nginx, porta 8080) ──┬─ "/"     ──> frontend (o site)
                                          └─ "/api/" ──> backend (a API) ──> banco (MariaDB)
```

- **Só o `proxy` tem porta aberta** (8080). O frontend, o backend e o banco não aparecem fora do Docker.
- Três redes: `rede-externa` (só o proxy), `rede-app` (proxy, frontend e backend) e `rede-banco` (backend e banco). As duas últimas são `internal`: não têm saída para fora.
- As regras do proxy estão em `nginx/proxy.conf`.
- Dados de demonstração: `docker compose exec backend node dist/scripts/popularDemonstracao.js` (precisa ter uma conta criada antes).
- Olhar o banco por dentro: `docker compose exec banco mariadb -u grao_nobre -p grao_nobre` (a senha é a `DB_PASSWORD` do `.env`).

## Testes

```
cd backend
npm test
```

Os testes usam repositórios em memória, então não precisam de banco.

## Organização

- `backend/src`: entidades, repositórios, serviços, rotas e testes
- `frontend/src`: telas (`pages`), componentes, serviços de API e as contas de estatística
- `AGENTS.md` e `.claude/`: regras e skills para agentes de IA que ajudarem no código

## Autor

Alex Venâncio da Silva - [github.com/aleeexkk](https://github.com/aleeexkk)
