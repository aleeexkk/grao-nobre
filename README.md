# Grão Nobre

Sistema para cafeteria/padaria, feito como projeto de fim de ano do curso (Back-end, Front-end, Estatística e Tech Forge).

## O que tem

- Cadastro, login (JWT) e edição do próprio perfil.
- CRUD de categorias, produtos e pedidos, com os itens de cada pedido. As listagens têm paginação.
- O pedido começa aberto e depois vira pago ou cancelado (e aí não muda mais). O total é calculado pelo banco e o preço do item fica guardado como era na hora da venda.
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

O site fica em `http://localhost:8080` e a API em `http://localhost:3000`. O banco é criado sozinho na primeira vez. Para apagar tudo e começar de novo: `docker compose down -v`.

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
