const { db } = require("../config/db");

async function logAdminActivity(req, activity = {}) {
    try {
        const admin = req.admin || {};

        const {
            action,
            entityType = null,
            entityId = null,
            description = null,
            metadata = null
        } = activity;

        if (!action) {
            console.error("Activity Logger: Action is required.");
            return false;
        }

        const adminId = admin.id || null;
        const adminName = admin.name || admin.full_name || null;
        const adminEmail = admin.email || null;

        const forwardedFor = req.headers["x-forwarded-for"];

        const ipAddress = forwardedFor
            ? forwardedFor.split(",")[0].trim()
            : req.ip || req.socket?.remoteAddress || null;

        const userAgent = req.headers["user-agent"] || null;

        await db.query(
            `INSERT INTO admin_activity_logs
            (
                admin_id,
                admin_name,
                admin_email,
                action,
                entity_type,
                entity_id,
                description,
                ip_address,
                user_agent,
                metadata
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                adminName,
                adminEmail,
                action,
                entityType,
                entityId !== null ? String(entityId) : null,
                description,
                ipAddress,
                userAgent,
                metadata ? JSON.stringify(metadata) : null
            ]
        );

        return true;

    } catch (error) {
        console.error("Admin Activity Logger Error:", error.message);
        return false;
    }
}

module.exports = logAdminActivity;
