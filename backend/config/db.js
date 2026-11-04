const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

// Aiven Public CA Certificate
const AIVEN_CA = `-----BEGIN CERTIFICATE-----
MIIERDCCAqygAwIBAgIUE2p6PJPO3/gIx5iK5W8MrLn+UdkwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvZGIyZDM5NmQtMjA5MS00Mzg2LWFjOTUtOTBkYTU4MmMw
MTY4IFByb2plY3QgQ0EwHhcNMjYxMTA0MDcyODQwWhcNMzYxMTAxMDcyODQwWjA6
MTgwNgYDVQQDDC9kYjJkMzk2ZC0yMDkxLTQzODYtYWM5NS05MGRhNTgyYzAxNjgg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAMqwnFie
RRWhwzpK56Ul0mA31hbsFMKNzucwcH0DzWPKJelaqRtn2wqCLnpa9oGb7pZwp/Vp
VPs6qiRVH1wHbi55g/CHo2w1+wLziKdobTdtjWZSXNQUcWo70jxjBCJreRYJGz4y
QQsJ08nHuOo/WyCnOIgyrbkZ8ClqDFyzhMMTtbAgBh8S/dfHGzoeV9nONTGjUOzr
6ByLHk0WNLh2V2HvmCGsacxooV4JQvaOAE3denaXm/yTqrxUoyDXk3XvxqP4HNCe
daru+XG14bp1zUA7IlMYjX4p7eSlLTrbnMIqRfcbQ6cqoKhUKdKHsp9c88l8YOTg
3WY/zf/YAmocWqrSlR6t/hjpZNkB/x1+P8zaD1yYDy6IWRy8oi7RMb3ny/AOTSwD
58iml3hKall9SB+khwF9jAW8YAzrgba/zhR/HYaZ8BQP8m+cQvvQpJxx2im6Y3nL
mlQ2KVQUpkjdhl+j2mzlVEoO50J9asK3d1Br6Kp6QAPnd0QpOewdOEAOLQIDAQAB
o0IwQDAdBgNVHQ4EFgQUTu6TP5kt8hDQO155kXuZr7Yy2yMwEgYDVR0TAQH/BAgw
BgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAFjVDI+j5dCE
uE70w7bDS2Dglpk52VjIhlfEDhN6ZF4l8/9nSXEmLCfVidUKWjKKyzhLKdp34I36
jwaKAHS+lPTK+k0C3ArhkmF/8WECFwumL3GR1H1nUbmblI3Ibh7OzPR7hnoN7IIY
wTPjVp9ytQAAjOcSwu1juKzale4dP4OyZgurxlI8v19A6i4JYA7eGIJlpMhRsAde
6eh6lO9eGTkgIvCZP5Xvzxj7XPruUzU8kvXxKwzEkjzqPQ5HEBbU5x/i2g7SbdGg
c6EFzApxd4SYipVofP+HSq/t+bKYI6U0V3gQE+forb0WygnOTNKCa9Qv9bXeXjoh
7WGXy4+cAIznrX2E6iDcjuPJ5TkkId6/y11eZfrtt9pFo9YarBsvtE+Igp+GtxuM
a+eUIgc4ZirpAP/YGv9fvYwPNZ9n1luBvamlH/0JAqugdticcNccjPqLg7cRf4p8
JIiXi/WBjtgw1gMJ/GqsDlYqRWApT1C56ijlN3tXos1WlPAxxXB3Vw==
-----END CERTIFICATE-----`;

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

const caCertificate = caPath
    ? fs.readFileSync(caPath)
    : AIVEN_CA;

console.log(
    "Aiven CA certificate loaded from:",
    caPath || "Embedded certificate"
);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: caCertificate,
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    let connection;

    try {
        connection = await db.getConnection();

        console.log("MySQL Database Connected Successfully!");

        const [rows] = await connection.query(
            "SELECT DATABASE() AS database_name"
        );

        console.log("Connected Database:", rows[0].database_name);

    } catch (error) {
        console.error("MySQL Connection Failed:", error.message);
        throw error;

    } finally {
        if (connection) connection.release();
    }
}

module.exports = { db, testConnection };
