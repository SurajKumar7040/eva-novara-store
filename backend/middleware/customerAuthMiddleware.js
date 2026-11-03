const jwt = require("jsonwebtoken");
const { db } = require("../config/db");

async function customerAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Customer authentication required."
            });
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "customer" || !decoded.id) {
            return res.status(403).json({
                success: false,
                message: "Invalid customer token."
            });
        }

        const [customers] = await db.query(
            `SELECT id, name, email, mobile, is_active, token_version
             FROM customers
             WHERE id = ?
             LIMIT 1`,
            [decoded.id]
        );

        if (!customers.length || !customers[0].is_active) {
            return res.status(401).json({
                success: false,
                message: "Customer account is unavailable."
            });
        }

        const customer = customers[0];

        if (
            Number(decoded.tokenVersion) !==
            Number(customer.token_version)
        ) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again."
            });
        }

        req.customer = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            mobile: customer.mobile
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired customer session."
        });
    }
}

module.exports = customerAuthMiddleware;
