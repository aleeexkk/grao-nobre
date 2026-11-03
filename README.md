# Grão Nobre

Sistema para cafeteria/padaria, feito como projeto de fim de ano do curso (Back-end, Front-end, Estatística e Tech Forge).

## O que já tem

- **Back-end** (Node + TypeScript + Express): cadastro, login com JWT e edição de usuário (só o próprio usuário, e o e-mail não muda). Validação de CPF, e-mail e senha, e a senha é salva criptografada (bcrypt).
- **Front-end** (React + TypeScript): telas de cadastro, login, perfil e um painel com métricas e gráficos de vendas (dados de exemplo). O usuário logado fica guardado num contexto e o token no `localStorage`.
- **Banco** (MariaDB): o script está em `banco/grao_nobre.sql`.

## Como rodar

1. Ligue o MariaDB/MySQL (pelo XAMPP, por exemplo) e execute o arquivo `banco/grao_nobre.sql`.

2. Back-end (porta 3000):

```
cd backend
copy .env.example .env
```

Abra o `.env` e preencha o `JWT_SECRET` com um texto grande e aleatório (mínimo de 16 caracteres). Depois:

```
npm install
npm run dev
```

Para rodar os testes do back-end: `npm test`.

3. Front-end (porta 5173), em outro terminal:

```
cd frontend
npm install
npm run dev
```

Depois é só abrir `http://localhost:5173`.

## Autor

Alex Venâncio da Silva - [github.com/aleeexkk](https://github.com/aleeexkk)
