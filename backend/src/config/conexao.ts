import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Lê o arquivo .env e coloca as configurações em process.env
dotenv.config();

// Pool = grupo de conexões reaproveitadas (mais eficiente que abrir uma a cada pedido)
export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT), // o .env sempre entrega texto, então converte pra número
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});