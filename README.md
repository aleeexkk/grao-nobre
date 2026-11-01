# ☕ Grão Nobre

Sistema de gestão para uma **cafeteria/padaria**: cadastro de usuários e painel com métricas e gráficos de vendas.

> Projeto de fim de ano do curso (Tech Academy / Back-end com IA, Front-end, Probabilidade e Estatística e Tech Forge).
> Este README descreve a **Sprint 1**.

## 👤 Persona

Dono de uma cafeteria/padaria que precisa organizar o cardápio e os pedidos do dia e enxergar, nos gráficos, **o que mais vende e em quais horários**.

## 🧱 Tecnologias

| Parte | Tecnologias |
|---|---|
| Back-end | Node.js, TypeScript, Express, MariaDB (mysql2), bcryptjs |
| Front-end | React, TypeScript, Vite, React Router, Recharts |
| Banco de dados | MariaDB (via XAMPP e DBeaver) |

O back-end e o front-end são **projetos separados** (pastas `backend` e `frontend`).

## 📁 Estrutura

```
grao-nobre/
├── backend/          # API (Express + TypeScript)
│   └── src/
│       ├── config/         # conexão com o banco
│       ├── entidades/      # classe Usuario (POO)
│       ├── erros/          # erros personalizados
│       ├── repositorios/   # acesso ao banco
│       ├── rotas/          # endpoints da API
│       ├── servicos/       # regras de negócio
│       ├── validadores/    # validação de e-mail, CPF, senha e nome
│       └── servidor.ts     # ponto de entrada
├── frontend/         # Interface (React + TypeScript)
│   └── src/
│       ├── components/     # componentes reutilizáveis (campo, cartões, gráficos)
│       ├── pages/          # telas (Cadastro, Login, Painel)
│       ├── estatisticas/   # métricas e regressão
│       ├── dados/          # dados de exemplo (fictícios)
│       ├── servicos/       # comunicação com a API
│       ├── validadores/    # validações do formulário
│       └── utils/          # formatação de moeda, números e datas
└── banco/
    └── grao_nobre.sql      # script do banco de dados
```

## ▶️ Como rodar

**Pré-requisitos:** Node.js 24 e MariaDB/MySQL ligado (por exemplo, pelo XAMPP).

**1. Banco de dados**

Abra o arquivo `banco/grao_nobre.sql` no DBeaver (conexão `localhost`) e execute tudo (Alt + X).

**2. Back-end** (porta 3000)

```bash
cd backend
copy .env.example .env
npm install
npx tsx src/servidor.ts
```

**3. Front-end** (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Telas: `http://localhost:5173/cadastro` · `http://localhost:5173/login` · `http://localhost:5173/dashboard`

## ✅ O que a Sprint 1 entrega

### Back-end: cadastro de usuário
- Campos obrigatórios: nome, e-mail, senha e CPF
- Validação de **CPF** (dígitos verificadores), de **e-mail** e de **nível de senha** (8+ caracteres, maiúscula, minúscula, número e símbolo)
- Senha **criptografada** (hash bcrypt) antes de ir pro banco
- Bloqueio de e-mail e CPF repetidos

**Endpoint:** `POST /usuarios`

| Resposta | Quando |
|---|---|
| `201` `{ id, nome, email }` | Cadastro realizado |
| `400` `{ erro }` | Dado inválido ou campo faltando |
| `409` `{ erro }` | E-mail ou CPF já cadastrado |
| `500` `{ erro }` | Erro interno |

Para ver os 5 cenários funcionando (com o servidor ligado): `npx tsx src/testeApi.ts` dentro de `backend`.

### Front-end: tela de cadastro
- Campos obrigatórios, **senha com confirmação**, validação de CPF e e-mail
- Mensagens de erro vindas da API exibidas de forma amigável
- Redirecionamento para o **login** após o cadastro
- Componentização: `CampoTexto`, `CartaoMetrica` e `CartaoGrafico` reutilizáveis; páginas e componentes em pastas separadas

### Estatística: painel da cafeteria
Dados de exemplo **fictícios** (30 dias de vendas de outubro), com:
- **Métricas:** faturamento total, valor médio por venda, média, mediana e desvio padrão do faturamento diário, produto mais vendido e horário de pico
- **Gráficos:** barras (produtos mais vendidos), série temporal (faturamento por dia com a média), histograma (vendas por horário) e dispersão com **regressão linear** (preço × unidades vendidas: inclinação ≈ −12,8, r ≈ −0,24, R² ≈ 0,06)

### Tech Forge: Programação Orientada a Objetos
- **Encapsulamento:** a classe `Usuario` tem atributos `private`
- **Acesso controlado:** `getters` e `setters` só onde há validação (nome e CPF com setter validado; e-mail só leitura; senha só escrita)
- **Exceções personalizadas:** `ErroValidacao` e `ErroConflito`
- **Organização:** entidades, serviços, repositórios, rotas, validadores e erros em pastas separadas
- Responsabilidade única por classe e injeção de dependência (o serviço recebe o repositório)

## 🔜 Próximas sprints
Login com JWT, CRUDs (categorias, produtos, pedidos e itens), Docker e configuração de agentes (`AGENTS.md`).

## 👨‍💻 Autor
Alex ([aleeexkk](https://github.com/aleeexkk))