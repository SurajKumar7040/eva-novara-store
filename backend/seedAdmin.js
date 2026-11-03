require("dotenv").config();

const bcrypt = require("bcryptjs");
const { db } = require("./config/db");

async function createAdmin() {
    try {
        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env"
            );
        }

        if (password.length < 12) {
            throw new Error("Admin password must be at least 12 characters.");
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await db.query(
            "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
            [normalizedEmail]
        );

        if (existing.length > 0) {
            console.log("Admin account already exists. No changes made.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.query(
            `INSERT INTO admin_users (name, email, password, role)
             VALUES (?, ?, ?, ?)`,
            [name.trim(), normalizedEmail, hashedPassword, "Admin"]
        );

        console.log("Admin account created successfully.");
        console.log("Admin Email:", normalizedEmail);

    } catch (error) {
        console.error("Admin Creation Error:", error.message);
        process.exitCode = 1;

    } finally {
        await db.end();
    }
}

createAdmin();
