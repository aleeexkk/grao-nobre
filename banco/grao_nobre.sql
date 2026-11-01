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