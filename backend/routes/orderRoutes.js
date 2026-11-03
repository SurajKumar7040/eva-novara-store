const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const customerAuthMiddleware = require("../middleware/customerAuthMiddleware");

// ==========================================
// OPTIONAL CUSTOMER AUTHENTICATION
// ==========================================

function optionalCustomerAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";

    // Guest checkout is allowed.
    if (!authHeader) {
        return next();
    }

    // If token is provided, verify it.
    return customerAuthMiddleware(req, res, next);
}


// ==========================================
// CREATE ORDER
// ==========================================

router.post("/", optionalCustomerAuth, async (req, res) => {

    const { customer, items } = req.body || {};

    // Validate delivery details.
    const requiredCustomerFields = [
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "pincode"
    ];

    if (
        !customer ||
        requiredCustomerFields.some(
            (field) => !String(customer[field] || "").trim()
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "All delivery details are required."
        });
    }

    // Validate cart.
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Cart is empty."
        });
    }

    for (const item of items) {

        if (
            !Number.isInteger(Number(item.id)) ||
            Number(item.id) <= 0 ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) < 1 ||
            Number(item.quantity) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or quantity."
            });
        }
    }

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        const orderItems = [];
        let subtotal = 0;

        // ======================================
        // VERIFY PRODUCTS AND CALCULATE PRICES
        // ======================================

        for (const item of items) {

            const [products] = await connection.query(
                `SELECT id, name, price
                 FROM products
                 WHERE id = ?
                 LIMIT 1`,
                [Number(item.id)]
            );

            if (products.length === 0) {
                throw new Error(`Product ${item.id} was not found.`);
            }

            const product = products[0];

            const quantity = Number(item.quantity);
            const price = Number(product.price);

            const lineTotal = Number(
                (price * quantity).toFixed(2)
            );

            subtotal = Number(
                (subtotal + lineTotal).toFixed(2)
            );

            orderItems.push({
                productId: product.id,
                productName: product.name,
                quantity,
                price,
                total: lineTotal
            });
        }

        // ======================================
        // ORDER TOTAL
        // ======================================

        const deliveryCharge = 0;

        const totalAmount = Number(
            (subtotal + deliveryCharge).toFixed(2)
        );

        const orderNumber =
            `EVN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // ======================================
        // VERIFIED CUSTOMER ID
        // ======================================

        // Customer ID comes only from verified JWT.
        // Guest orders will have customer_id = NULL.

        const customerId = req.customer
            ? req.customer.id
            : null;

        // ======================================
        // INSERT ORDER
        // ======================================

        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (
                customer_id,
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
                payment_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customerId,
                orderNumber,
                String(customer.name).trim(),
                String(customer.email).trim(),
                String(customer.phone).trim(),
                String(customer.address).trim(),
                String(customer.city).trim(),
                String(customer.state).trim(),
                String(customer.pincode).trim(),
                subtotal,
                deliveryCharge,
                totalAmount,
                "Pending",
                "Not Paid"
            ]
        );

        // ======================================
        // INSERT ORDER ITEMS
        // ======================================

        for (const item of orderItems) {

            await connection.query(
                `INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    product_name,
                    quantity,
                    price,
                    total
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderResult.insertId,
                    item.productId,
                    item.productName,
                    item.quantity,
                    item.price,
                    item.total
                ]
            );
        }

        // ======================================
        // COMMIT TRANSACTION
        // ======================================

        await connection.commit();

        return res.status(201).json({

            success: true,

            message: "Order saved successfully.",

            order: {
                id: orderResult.insertId,
                orderNumber,
                customerId,
                totalAmount,
                createdAt: new Date().toLocaleString("en-IN"),
                items: orderItems
            }

        });

    } catch (error) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Order Rollback Error:", rollbackError);
            }
        }

        console.error("Create Order API Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to save order."
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }

});

module.exports = router;