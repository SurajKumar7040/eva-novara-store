const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const logAdminActivity = require("../utils/activityLogger");

// All routes below require Admin authentication.
router.use(authMiddleware);

// ==========================================
// PRODUCT IMAGE UPLOAD CONFIGURATION
// ==========================================

const productUploadDir = path.join(
    __dirname,
    "../uploads/products"
);

fs.mkdirSync(productUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productUploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;

        cb(null, filename);
    }
});

const imageUpload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error("Only JPG, PNG and WebP images are allowed.")
            );
        }

        cb(null, true);
    }
});

// Upload Product Image
router.post(
    "/products/upload-image",
    (req, res, next) => {
        imageUpload.single("image")(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.code === "LIMIT_FILE_SIZE"
                        ? "Image size must not exceed 5 MB."
                        : error.message
                });
            }

            next();
        });
    },
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a product image."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Product image uploaded successfully.",
            image: `/uploads/products/${req.file.filename}`
        });
    }
);

// ==========================================
// 1. DASHBOARD STATISTICS
// ==========================================

router.get("/dashboard", async (req, res) => {
    try {
        const [[orders]] = await db.query(`
            SELECT
                COUNT(*) AS totalOrders,
                COALESCE(SUM(total_amount), 0) AS totalRevenue,
                SUM(status = 'Pending') AS pendingOrders,
                SUM(payment_status = 'Paid') AS paidOrders
            FROM orders
        `);

        const [[products]] = await db.query(`
            SELECT COUNT(*) AS totalProducts FROM products
        `);

        const [[customers]] = await db.query(`
            SELECT COUNT(DISTINCT email) AS totalCustomers FROM orders
        `);

        const [[messages]] = await db.query(`
            SELECT COUNT(*) AS newMessages
            FROM contact_messages
            WHERE status = 'New'
        `);

        return res.json({
            success: true,
            statistics: {
                ...orders,
                ...products,
                ...customers,
                ...messages
            }
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard statistics."
        });
    }
});


// ==========================================
// 2. GET ALL ORDERS
// ==========================================

router.get("/orders", async (req, res) => {
    try {
        const [orders] = await db.query(
            "SELECT * FROM orders ORDER BY created_at DESC"
        );

        return res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Admin Orders API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch orders."
        });
    }
});


// ==========================================
// 3. GET SINGLE ORDER WITH ITEMS
// ==========================================

router.get("/orders/:id", async (req, res) => {
    try {
        const [orders] = await db.query(
            "SELECT * FROM orders WHERE id = ? LIMIT 1",
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const [items] = await db.query(
            "SELECT * FROM order_items WHERE order_id = ?",
            [req.params.id]
        );

        return res.json({
            success: true,
            order: orders[0],
            items
        });

    } catch (error) {
        console.error("Order Details API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch order details."
        });
    }
});


// ==========================================
// 4. UPDATE ORDER STATUS
// ==========================================

router.patch("/orders/:id/status", async (req, res) => {
    try {
        const { status } = req.body || {};

        const allowedStatuses = [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status."
            });
        }

        const [result] = await db.query(
            "UPDATE orders SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        await logAdminActivity(req, {
            action: "ORDER_STATUS_UPDATED",
            entityType: "ORDER",
            entityId: req.params.id,
            description: `Order #${req.params.id} status changed to ${status}.`,
            metadata: {
                newStatus: status
            }
        });

        return res.json({
            success: true,
            message: "Order status updated successfully."
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update order status."
        });
    }
});


// ==========================================
// 5. GET ALL PRODUCTS
// ==========================================

router.get("/products", async (req, res) => {
    try {
        const [products] = await db.query(
            "SELECT * FROM products ORDER BY id ASC"
        );

        return res.json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Admin Products API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch products."
        });
    }
});


// ==========================================
// 6. GET CUSTOMERS
// ==========================================

router.get("/customers", async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT
                customer_name,
                email,
                mobile,
                address,
                city,
                state,
                pincode,
                COUNT(*) AS totalOrders,
                SUM(total_amount) AS totalSpent,
                MAX(created_at) AS lastOrderDate
            FROM orders
            GROUP BY
                customer_name, email, mobile,
                address, city, state, pincode
            ORDER BY lastOrderDate DESC
        `);

        return res.json({
            success: true,
            count: customers.length,
            customers
        });

    } catch (error) {
        console.error("Admin Customers API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch customers."
        });
    }
});


// ==========================================
// 6.1 CUSTOMER COMPLETE ORDER HISTORY
// ==========================================

router.get("/customers/history", async (req, res) => {
    try {
        const {
            customer_name,
            email,
            mobile,
            address,
            city,
            state,
            pincode
        } = req.query;

        if (!customer_name || !email || !mobile) {
            return res.status(400).json({
                success: false,
                message: "Customer name, email and mobile are required."
            });
        }

        const [orders] = await db.query(
            `SELECT * FROM orders
             WHERE customer_name = ?
               AND email = ?
               AND mobile = ?
               AND address = ?
               AND city = ?
               AND state = ?
               AND pincode = ?
             ORDER BY created_at DESC`,
            [
                customer_name,
                email,
                mobile,
                address || "",
                city || "",
                state || "",
                pincode || ""
            ]
        );

        if (orders.length === 0) {
            return res.json({
                success: true,
                customer: {
                    customer_name,
                    email,
                    mobile,
                    address,
                    city,
                    state,
                    pincode
                },
                count: 0,
                totalSpent: 0,
                orders: []
            });
        }

        const orderIds = orders.map(order => order.id);
        const placeholders = orderIds.map(() => "?").join(",");

        const [items] = await db.query(
            `SELECT * FROM order_items
             WHERE order_id IN (${placeholders})
             ORDER BY order_id, id`,
            orderIds
        );

        const itemsByOrder = {};

        for (const item of items) {
            if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
            }

            itemsByOrder[item.order_id].push(item);
        }

        const orderHistory = orders.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
        }));

        const totalSpent = orders.reduce(
            (sum, order) => sum + Number(order.total_amount || 0),
            0
        );

        return res.json({
            success: true,
            customer: {
                customer_name,
                email,
                mobile,
                address,
                city,
                state,
                pincode
            },
            count: orders.length,
            totalSpent,
            orders: orderHistory
        });

    } catch (error) {
        console.error("Customer Order History API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch customer order history."
        });
    }
});


// ==========================================
// 7. GET CONTACT MESSAGES
// ==========================================

router.get("/messages", async (req, res) => {
    try {
        const [messages] = await db.query(
            "SELECT * FROM contact_messages ORDER BY created_at DESC"
        );

        return res.json({
            success: true,
            count: messages.length,
            messages
        });

    } catch (error) {
        console.error("Admin Messages API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch messages."
        });
    }
});


// ==========================================
// 8. UPDATE CONTACT MESSAGE STATUS
// ==========================================

router.patch("/messages/:id/status", async (req, res) => {
    try {
        const { status } = req.body || {};

        const allowedStatuses = ["New", "Read", "Replied"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message status."
            });
        }

        const [result] = await db.query(
            "UPDATE contact_messages SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        // Log activity BEFORE sending response
        await logAdminActivity(req, {
            action: "MESSAGE_STATUS_UPDATED",
            entityType: "CONTACT_MESSAGE",
            entityId: req.params.id,
            description: `Contact message #${req.params.id} status changed to ${status}.`,
            metadata: {
                newStatus: status
            }
        });

        return res.json({
            success: true,
            message: "Message status updated successfully."
        });

    } catch (error) {
        console.error("Update Message Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update message status."
        });
    }
});


// ==========================================
// PRODUCT MANAGEMENT - ADMIN CRUD APIs
// ==========================================


// ==========================================
// HELPER: PREPARE JSON FIELDS
// ==========================================

const prepareJsonField = (value, defaultValue = []) => {
    if (value === undefined || value === null || value === "") {
        return JSON.stringify(defaultValue);
    }

    if (typeof value === "string") {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed);
    }

    return JSON.stringify(value);
};


// ==========================================
// 9. ADD NEW PRODUCT
// ==========================================

router.post("/products", async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            image,
            stock,
            rating,
            reviews,
            overview,
            features,
            working,
            applications,
            specifications,
            box_contents
        } = req.body;

        if (!name || price === undefined || price === null || price === "") {
            return res.status(400).json({
                success: false,
                message: "Product name and price are required."
            });
        }

        const productPrice = Number(price);

        if (!Number.isFinite(productPrice) || productPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid product price."
            });
        }

        const [result] = await db.query(
            `INSERT INTO products
            (
                name,
                description,
                price,
                category,
                image,
                stock,
                rating,
                reviews,
                overview,
                features,
                working,
                applications,
                specifications,
                box_contents
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                description || "",
                productPrice,
                category || "",
                image || "",
                Number(stock) || 0,
                Number(rating) || 0,
                Number(reviews) || 0,
                overview || "",
                prepareJsonField(features),
                prepareJsonField(working),
                prepareJsonField(applications),
                prepareJsonField(specifications),
                prepareJsonField(box_contents)
            ]
        );

        await logAdminActivity(req, {
            action: "PRODUCT_CREATED",
            entityType: "PRODUCT",
            entityId: result.insertId,
            description: `New product "${name.trim()}" created.`,
            metadata: {
                productName: name.trim(),
                price: productPrice,
                category: category || ""
            }
        });

        return res.status(201).json({
            success: true,
            message: "Product added successfully.",
            productId: result.insertId
        });

    } catch (error) {
        console.error("Add Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add product."
        });
    }
});


// ==========================================
// 10. UPDATE PRODUCT
// ==========================================

router.put("/products/:id", async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            image,
            stock,
            rating,
            reviews,
            overview,
            features,
            working,
            applications,
            specifications,
            box_contents
        } = req.body;

        if (!name || price === undefined || price === null || price === "") {
            return res.status(400).json({
                success: false,
                message: "Product name and price are required."
            });
        }

        const productPrice = Number(price);

        if (!Number.isFinite(productPrice) || productPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid product price."
            });
        }

        const [result] = await db.query(
            `UPDATE products SET
                name = ?,
                description = ?,
                price = ?,
                category = ?,
                image = ?,
                stock = ?,
                rating = ?,
                reviews = ?,
                overview = ?,
                features = ?,
                working = ?,
                applications = ?,
                specifications = ?,
                box_contents = ?
            WHERE id = ?`,
            [
                name.trim(),
                description || "",
                productPrice,
                category || "",
                image || "",
                Number(stock) || 0,
                Number(rating) || 0,
                Number(reviews) || 0,
                overview || "",
                prepareJsonField(features),
                prepareJsonField(working),
                prepareJsonField(applications),
                prepareJsonField(specifications),
                prepareJsonField(box_contents),
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        await logAdminActivity(req, {
            action: "PRODUCT_UPDATED",
            entityType: "PRODUCT",
            entityId: req.params.id,
            description: `Product "${name.trim()}" updated.`,
            metadata: {
                productName: name.trim(),
                price: productPrice,
                category: category || ""
            }
        });

        return res.json({
            success: true,
            message: "Product updated successfully."
        });

    } catch (error) {
        console.error("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update product."
        });
    }
});


// ==========================================
// 11. DELETE PRODUCT
// ==========================================

router.delete("/products/:id", async (req, res) => {
    try {
        const productId = Number(req.params.id);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        const [result] = await db.query(
            "DELETE FROM products WHERE id = ?",
            [productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        await logAdminActivity(req, {
            action: "PRODUCT_DELETED",
            entityType: "PRODUCT",
            entityId: productId,
            description: `Product #${productId} deleted successfully.`
        });

        return res.json({
            success: true,
            message: "Product deleted successfully."
        });

    } catch (error) {
        console.error("Delete Product Error:", error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.errno === 1451
        ) {
            return res.status(409).json({
                success: false,
                message: "This product is linked to existing orders and cannot be deleted. You can set its stock to 0 instead."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to delete product."
        });
    }
});


// ==========================================
// 12. GET ADMIN ACTIVITY LOGS
// ==========================================

router.get("/activity-logs", async (req, res) => {
    try {
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 50, 1),
            100
        );

        const [logs] = await db.query(
            `SELECT
                id,
                admin_id,
                admin_name,
                admin_email,
                action,
                entity_type,
                entity_id,
                description,
                ip_address,
                user_agent,
                created_at
             FROM admin_activity_logs
             ORDER BY created_at DESC
             LIMIT ?`,
            [limit]
        );

        return res.json({
            success: true,
            total: logs.length,
            logs
        });

    } catch (error) {
        console.error("Activity Logs API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch activity logs."
        });
    }
});


module.exports = router;