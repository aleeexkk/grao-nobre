# Grão Nobre

Sistema para cafeteria/padaria, feito como projeto de fim de ano do curso (Back-end, Front-end, Estatística e Tech Forge). Este repositório está na Sprint 1.

## O que já tem

- **Back-end** (Node + TypeScript + Express): cadastro de usuário em `POST /usuarios`, com validação de CPF, e-mail e senha. A senha é salva criptografada (bcrypt).
- **Front-end** (React + TypeScript): tela de cadastro com confirmação de senha e um painel com métricas e gráficos de vendas (dados de exemplo).
- **Banco** (MariaDB): o script está em `banco/grao_nobre.sql`.

## Como rodar

1. Ligue o MariaDB/MySQL (pelo XAMPP, por exemplo) e execute o arquivo `banco/grao_nobre.sql`.

2. Back-end (porta 3000):

```
cd backend
copy .env.example .env
npm install
npx tsx src/servidor.ts
```

3. Front-end (porta 5173), em outro terminal:

```
cd frontend
npm install
npm run dev
```

Depois é só abrir `http://localhost:5173`.

## Autor

Alex Venâncio da Silva - [github.com/aleeexkk](https://github.com/aleeexkk)
