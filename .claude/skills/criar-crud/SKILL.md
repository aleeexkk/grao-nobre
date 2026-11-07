---
name: criar-crud
description: Cria um recurso novo (CRUD completo) no Grão Nobre seguindo os padrões do projeto, do banco até a tela. Use quando for pedido um cadastro novo, uma nova entidade ou "mais um CRUD".
---

# Criar um CRUD novo

Use `Categoria` (simples) e `Produto` (com relacionamento) como modelo. Vá na ordem; cada passo termina com o projeto compilando.
Trocar `X` pelo nome do recurso (ex.: `Fornecedor`).

## Back-end (`backend/src/`)

1. **Tabela** em `banco/grao_nobre.sql`: `CREATE TABLE IF NOT EXISTS`, chave primária `id_x`, `NOT NULL` onde for obrigatório,
   `UNIQUE` onde não pode repetir, chave estrangeira quando houver relacionamento, `DECIMAL` para dinheiro.
   O script precisa continuar rodando mais de uma vez sem erro.
2. **Entidade** `entidades/X.ts`: atributos privados, getters/setters que validam usando `validadores/validadores.ts`
   (reaproveite `validarTextoObrigatorio`, `validarPreco`, `validarIdPositivo`, `validarOpcao`...). Inválido lança `ErroValidacao`.
3. **Contrato** `repositorios/IXRepositorio.ts`: `XRegistro` (como o dado volta pro front) e
   `interface IXRepositorio extends IRepositorioCrud<X, XRegistro>`.
4. **Repositório MySQL** `repositorios/XRepositorio.ts`: estende `RepositorioMySqlBase` e informa `tabela`, `colunaId`, `colunas`,
   `paraRegistro`, `inserir` e `atualizar`. Use `?` em todo valor. Traduza erros do banco com `traduzirErro` (repetido vira 409).
   Se a listagem precisar de JOIN, ordem própria ou filtro, sobrescreva `origem`, `ordenacao` e `filtrosAceitos`.
5. **Serviço** `servicos/XServico.ts`: estende `ServicoCrudBase`, define `mensagemNaoEncontrado` e `criarEntidade`.
   Regra de negócio vai em `verificarRegras` (criar/editar) e `verificarExclusao` (apagar). Para consultar outro repositório,
   receba só o que precisa: `Pick<IYRepositorio, "buscarPorId">`.
6. **Rotas** `rotas/xRotas.ts`: uma função `lerDadosX(corpo)` (confere o corpo com `validadores/corpo.ts`) e
   `criarRotasCrud(servico, autenticar, lerDadosX)`. Registre em `app.ts` (interface `Dependencias` + `app.use("/xs", ...)`)
   e crie os objetos em `servidor.ts`.
7. **Testes**: `testes/XRepositorioMemoria.ts` (mesmo contrato, guarda num array), inclua em `dependenciasDeTeste.ts` e escreva
   `testes/x.test.ts` com: criar (201), listar com paginação, buscar, editar, excluir (204), validação (400), sem token (401),
   id inexistente (404) e cada regra de negócio (409/400).

## Front-end (`frontend/src/`)

8. **Cliente**: em `servicos/recursos.ts` declare os tipos `X`/`DadosX` e `export const clienteXs = criarClienteCrud<X, DadosX>("/xs")`.
9. **Lista** `pages/xs/ListaXs.tsx`: usa `ListaCrud` (informe `colunas`, textos e rotas). Funções de buscar/excluir ficam fora do componente.
10. **Formulário** `pages/xs/FormX.tsx`: usa `PaginaFormCrud` com a lista de `campos` (obrigatório, `validar`), `paraFormulario` e `paraDados`.
    Tudo no formulário é texto; a conversão para número/null acontece em `paraDados`.
11. **Rotas e menu**: `/xs`, `/xs/novo`, `/xs/:id/editar` em `App.tsx` e um link em `components/CabecalhoLogado.tsx`.

## Fechamento

Rode a skill `qualidade-antes-do-commit` e depois `revisar-seguranca` nos arquivos novos.
