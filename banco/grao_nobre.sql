-- Script do banco de dados do projeto Grão Nobre (MariaDB / MySQL)
-- Como usar: abra no DBeaver, selecione a conexão (localhost) e execute tudo com Alt + X.

CREATE DATABASE IF NOT EXISTS grao_nobre;
USE grao_nobre;

-- Tabela de usuários (base do cadastro e do login)
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY, -- número único, gerado pelo banco
    nome VARCHAR(100) NOT NULL,                -- campo obrigatório
    email VARCHAR(150) NOT NULL UNIQUE,        -- não aceita dois e-mails iguais
    senha VARCHAR(255) NOT NULL,               -- guarda o hash (bcrypt), nunca a senha em texto puro
    cpf VARCHAR(11) NOT NULL UNIQUE            -- só os 11 números, sem pontos e traço
);

-- Tabela de categorias (as "gavetas" do cardápio: Cafés, Pães, Doces...)
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY, -- número único, gerado pelo banco
    nome VARCHAR(60) NOT NULL UNIQUE,            -- obrigatório e sem repetir ("Cafés" só uma vez)
    descricao VARCHAR(200) NULL                  -- opcional
);

-- Tabela de produtos (cada produto fica dentro de uma categoria)
CREATE TABLE IF NOT EXISTS produto (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,   -- número único, gerado pelo banco
    nome VARCHAR(100) NOT NULL UNIQUE,           -- obrigatório e sem repetir
    descricao VARCHAR(255) NULL,                 -- opcional
    preco DECIMAL(10, 2) NOT NULL,               -- dinheiro: DECIMAL (nunca FLOAT, que erra centavos)
    id_categoria INT NOT NULL,                   -- em qual categoria o produto está
    -- Chave estrangeira: só aceita um id_categoria que EXISTE na tabela categoria
    -- e impede apagar uma categoria que ainda tem produtos
    CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
);

-- Tabela de pedidos (o "cabeçalho": quem registrou, o cliente, o status e quando foi feito)
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,                                          -- funcionário que registrou o pedido
    cliente VARCHAR(100) NULL,                                        -- opcional (no balcão nem sempre pedem o nome)
    status ENUM('aberto', 'pago', 'cancelado') NOT NULL DEFAULT 'aberto', -- só aceita um desses 3 valores
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,            -- o banco preenche com o momento do pedido
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- Tabela de itens do pedido (cada linha: "2 cafés expressos no pedido 15")
CREATE TABLE IF NOT EXISTS item_pedido (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    -- Preço do produto NO MOMENTO da venda: se o produto ficar mais caro depois, os pedidos antigos não mudam
    preco_unitario DECIMAL(10, 2) NOT NULL,
    -- Apagar um pedido apaga os itens dele junto (ON DELETE CASCADE)
    CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    -- Um produto que já foi vendido não pode ser apagado (o histórico ficaria sem sentido)
    CONSTRAINT fk_item_produto FOREIGN KEY (id_produto) REFERENCES produto (id_produto),
    -- O mesmo produto só aparece uma vez por pedido (pra mais unidades, aumenta a quantidade)
    CONSTRAINT uq_item_pedido_produto UNIQUE (id_pedido, id_produto)
);
