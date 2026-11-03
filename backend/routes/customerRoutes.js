const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const customerAuthMiddleware = require("../middleware/customerAuthMiddleware");

const router = express.Router();

const createCustomerToken = (customer) => {
    return jwt.sign(
        {
            id: customer.id,
            email: customer.email,
            type: "customer",
            tokenVersion: Number(customer.token_version)
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// ==========================================
// 1. CUSTOMER REGISTRATION
// ==========================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body || {};

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, mobile and password are required."
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanMobile = String(mobile).trim();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobilePattern = /^[0-9]{10,15}$/;

        if (cleanName.length < 2 || cleanName.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Name must contain 2 to 150 characters."
            });
        }

        if (!emailPattern.test(cleanEmail) || cleanEmail.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (!mobilePattern.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid mobile number with 10 to 15 digits."
            });
        }

        if (typeof password !== "string" || password.length < 8 || password.length > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must contain 8 to 72 characters."
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM customers WHERE email = ? LIMIT 1",
            [cleanEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            `INSERT INTO customers (name, email, mobile, password)
             VALUES (?, ?, ?, ?)`,
            [cleanName, cleanEmail, cleanMobile, hashedPassword]
        );

        const customer = {
            id: result.insertId,
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
            token_version: 0
        };

        const token = createCustomerToken(customer);

        return res.status(201).json({
            success: true,
            message: "Customer account created successfully.",
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                mobile: customer.mobile
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        console.error("Customer Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create customer account."
        });
    }
});


// ==========================================
// 2. CUSTOMER LOGIN
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

        const [customers] = await db.query(
            `SELECT id, name, email, mobile, password,
                    is_active, token_version
             FROM customers
             WHERE email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        if (!customers.length) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const customer = customers[0];

        if (!customer.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact support."
            });
        }

        const passwordMatch = await bcrypt.compare(
            String(password),
            customer.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = createCustomerToken(customer);

        return res.json({
            success: true,
            message: "Customer login successful.",
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                mobile: customer.mobile
            }
        });

    } catch (error) {
        console.error("Customer Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
});


// ==========================================
// 3. CUSTOMER PROFILE
// ==========================================

router.get("/profile", customerAuthMiddleware, async (req, res) => {
    try {
        const [customers] = await db.query(
            `SELECT id, name, email, mobile, created_at
             FROM customers
             WHERE id = ?
             LIMIT 1`,
            [req.customer.id]
        );

        if (!customers.length) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found."
            });
        }

        return res.json({
            success: true,
            customer: customers[0]
        });

    } catch (error) {
        console.error("Customer Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch customer profile."
        });
    }
});

// ==========================================
// 4. CUSTOMER ORDERS
// ==========================================

router.get("/orders", customerAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.customer.id;

        // Fetch only logged-in customer's orders.
        const [orders] = await db.query(
            `SELECT
                id,
                order_number,
                customer_name,
                email,
                mobile,
                address,
                city,
                state,
                pincode,
                subtotal,
                delivery_charge,
                total_amount,
                status,
                payment_status,
                created_at
             FROM orders
             WHERE customer_id = ?
             ORDER BY created_at DESC
             LIMIT 50`,
            [customerId]
        );

        // Fetch products for each order.
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {

                const [items] = await db.query(
                    `SELECT
                        id,
                        product_id,
                        product_name,
                        quantity,
                        price,
                        total
                     FROM order_items
                     WHERE order_id = ?
                     ORDER BY id ASC`,
                    [order.id]
                );

                return {
                    ...order,
                    items
                };
            })
        );

        return res.json({
            success: true,
            message: "Customer orders fetched successfully.",
            totalOrders: ordersWithItems.length,
            orders: ordersWithItems
        });

    } catch (error) {

        console.error("Customer Orders API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch customer orders."
        });
    }
});
// ==========================================
// 4. CUSTOMER LOGOUT
// ==========================================

router.post("/logout", customerAuthMiddleware, async (req, res) => {
    try {
        await db.query(
            `UPDATE customers
             SET token_version = token_version + 1
             WHERE id = ?`,
            [req.customer.id]
        );

        return res.json({
            success: true,
            message: "Customer logout successful."
        });

    } catch (error) {
        console.error("Customer Logout Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to logout."
        });
    }
});

module.exports = router;
