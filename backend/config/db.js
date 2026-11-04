const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const possibleCaPaths = [
    process.env.DB_SSL_CA_PATH,
    path.join(__dirname, "../certs/ca.pem"),
    path.resolve(process.cwd(), "cloud-functions/api/ca.pem"),
    path.join(__dirname, "../../cloud-functions/api/ca.pem"),
    "/var/certs/ca.pem"
].filter(Boolean);

const caPath = possibleCaPaths.find(
    (filePath) => fs.existsSync(filePath)
);

if (!caPath) {
    throw new Error(
        `Aiven CA certificate not found. Checked: ${possibleCaPaths.join(", ")}`
    );
}

console.log("Aiven CA certificate loaded from:", caPath);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(caPath),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await db.getConnection();

        console.log("MySQL Database Connected Successfully!");

        const [rows] = await connection.query(
            "SELECT DATABASE() AS database_name"
        );

        console.log("Connected Database:", rows[0].database_name);

        connection.release();
    } catch (error) {
        console.error("MySQL Connection Failed:", error.message);
    }
}

module.exports = { db, testConnection };
