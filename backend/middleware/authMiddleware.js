const jwt = require("jsonwebtoken");
const { db } = require("../config/db");

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const [admins] = await db.query(
            `SELECT id, name, email, role, token_version
             FROM admin_users
             WHERE id = ?
             LIMIT 1`,
            [decoded.id]
        );

        if (!admins.length) {
            return res.status(401).json({
                success: false,
                message: "Admin account not found."
            });
        }

        const admin = admins[0];

        if (
            Number(decoded.tokenVersion ?? 0) !==
            Number(admin.token_version ?? 0)
        ) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again."
            });
        }

        req.admin = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
}

module.exports = authMiddleware;