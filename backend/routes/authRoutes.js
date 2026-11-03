const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const logAdminActivity = require("../utils/activityLogger");

const router = express.Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;


// ==========================================
// CREATE ADMIN TOKEN
// ==========================================

function createAdminToken(admin) {
    return jwt.sign(
        {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            tokenVersion: Number(admin.token_version ?? 0)
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
    );
}


// ==========================================
// 1. ADMIN LOGIN WITH SECURITY
// ==========================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        const [admins] = await db.query(
            `SELECT
                id,
                name,
                email,
                password,
                role,
                token_version,
                failed_login_attempts,
                locked_until
             FROM admin_users
             WHERE email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        if (!admins.length) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const admin = admins[0];

        // Check whether account is locked
        if (
            admin.locked_until &&
            new Date(admin.locked_until).getTime() > Date.now()
        ) {
            return res.status(423).json({
                success: false,
                message: "Account temporarily locked. Please try again after 15 minutes.",
                lockedUntil: admin.locked_until
            });
        }

        // Reset expired lock
        if (admin.locked_until) {
            await db.query(
                `UPDATE admin_users
                 SET failed_login_attempts = 0,
                     locked_until = NULL
                 WHERE id = ?`,
                [admin.id]
            );

            admin.failed_login_attempts = 0;
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(
            String(password),
            admin.password
        );

        if (!passwordMatch) {
            const failedAttempts =
                Number(admin.failed_login_attempts || 0) + 1;

            if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {

                await db.query(
                    `UPDATE admin_users
                     SET failed_login_attempts = ?,
                         locked_until = DATE_ADD(
                             NOW(),
                             INTERVAL ? MINUTE
                         )
                     WHERE id = ?`,
                    [
                        failedAttempts,
                        LOCK_DURATION_MINUTES,
                        admin.id
                    ]
                );

                await logAdminActivity(req, {
                    action: "ACCOUNT_LOCKED",
                    entityType: "ADMIN",
                    entityId: admin.id,
                    description: "Admin account locked after multiple failed login attempts."
                });

                return res.status(423).json({
                    success: false,
                    message: "Too many failed attempts. Account locked for 15 minutes."
                });
            }

            await db.query(
                `UPDATE admin_users
                 SET failed_login_attempts = ?
                 WHERE id = ?`,
                [failedAttempts, admin.id]
            );

            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
                remainingAttempts:
                    MAX_LOGIN_ATTEMPTS - failedAttempts
            });
        }

        // Successful login: reset security counters
        await db.query(
            `UPDATE admin_users
             SET failed_login_attempts = 0,
                 locked_until = NULL
             WHERE id = ?`,
            [admin.id]
        );

        const token = createAdminToken(admin);

        req.admin = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        };

        await logAdminActivity(req, {
            action: "LOGIN",
            entityType: "ADMIN",
            entityId: admin.id,
            description: "Admin logged in successfully."
        });

        return res.json({
            success: true,
            message: "Admin login successful.",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
});


// ==========================================
// 2. VERIFY TOKEN
// ==========================================

router.get("/verify", authMiddleware, (req, res) => {
    return res.json({
        success: true,
        message: "Admin authenticated successfully.",
        admin: req.admin
    });
});


// ==========================================
// 3. GET ADMIN PROFILE
// ==========================================

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const [admins] = await db.query(
            `SELECT id, name, email, role, created_at
             FROM admin_users
             WHERE id = ?
             LIMIT 1`,
            [req.admin.id]
        );

        if (!admins.length) {
            return res.status(404).json({
                success: false,
                message: "Admin profile not found."
            });
        }

        return res.json({
            success: true,
            message: "Admin profile fetched successfully.",
            admin: admins[0]
        });

    } catch (error) {
        console.error("Get Admin Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch admin profile."
        });
    }
});


// ==========================================
// 4. UPDATE ADMIN PROFILE
// ==========================================

router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body || {};

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required."
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();

        if (cleanName.length < 2 || cleanName.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Name must contain 2 to 150 characters."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const [existing] = await db.query(
            `SELECT id
             FROM admin_users
             WHERE email = ? AND id != ?
             LIMIT 1`,
            [cleanEmail, req.admin.id]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "This email is already in use."
            });
        }

        const oldName = req.admin.name;
        const oldEmail = req.admin.email;

        await db.query(
            `UPDATE admin_users
             SET name = ?, email = ?
             WHERE id = ?`,
            [cleanName, cleanEmail, req.admin.id]
        );

        const [updated] = await db.query(
            `SELECT id, name, email, role, created_at
             FROM admin_users
             WHERE id = ?
             LIMIT 1`,
            [req.admin.id]
        );

        await logAdminActivity(req, {
            action: "PROFILE_UPDATE",
            entityType: "ADMIN",
            entityId: req.admin.id,
            description: "Admin profile updated.",
            metadata: {
                oldName,
                newName: cleanName,
                oldEmail,
                newEmail: cleanEmail
            }
        });

        return res.json({
            success: true,
            message: "Admin profile updated successfully.",
            admin: updated[0]
        });

    } catch (error) {
        console.error("Update Admin Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update admin profile."
        });
    }
});


// ==========================================
// 5. CHANGE ADMIN PASSWORD
// ==========================================

router.patch("/change-password", authMiddleware, async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body || {};

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required."
            });
        }

        if (newPassword.length < 10) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 10 characters."
            });
        }

        if (
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[^A-Za-z0-9]/.test(newPassword)
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must include uppercase, lowercase, number and special character."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password."
            });
        }

        const [admins] = await db.query(
            `SELECT id, password
             FROM admin_users
             WHERE id = ?
             LIMIT 1`,
            [req.admin.id]
        );

        if (!admins.length) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found."
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            admins[0].password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await db.query(
            `UPDATE admin_users
             SET password = ?,
                 token_version = token_version + 1,
                 failed_login_attempts = 0,
                 locked_until = NULL
             WHERE id = ?`,
            [hashedPassword, req.admin.id]
        );

        await logAdminActivity(req, {
            action: "PASSWORD_CHANGE",
            entityType: "ADMIN",
            entityId: req.admin.id,
            description: "Admin password changed successfully."
        });

        return res.json({
            success: true,
            message: "Password changed successfully. Please login again."
        });

    } catch (error) {
        console.error("Change Admin Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to change password."
        });
    }
});


// ==========================================
// 6. ADMIN LOGOUT
// ==========================================

router.post("/logout", authMiddleware, async (req, res) => {
    try {

        await logAdminActivity(req, {
            action: "LOGOUT",
            entityType: "ADMIN",
            entityId: req.admin.id,
            description: "Admin logged out."
        });

        // Invalidate all existing tokens for this admin
        await db.query(
            `UPDATE admin_users
             SET token_version = token_version + 1
             WHERE id = ?`,
            [req.admin.id]
        );

        return res.json({
            success: true,
            message: "Admin logout successful. All sessions invalidated."
        });

    } catch (error) {
        console.error("Admin Logout Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to record logout."
        });
    }
});


module.exports = router;