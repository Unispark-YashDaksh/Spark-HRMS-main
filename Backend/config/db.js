require("dotenv").config();
const mysql= require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Unispark@2022",
  database: process.env.DATABASE || process.env.DB_NAME || "attendease_database",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 150,
  queueLimit: 0,
});

// Test MySQL Connection
pool.getConnection()
    .then(connection => {
        console.log("MySQL Connected Successfully");
        connection.release();
    })
    .catch(err => {
        console.log("MySQL Connection Failed:", err.message);
});

module.exports= pool;