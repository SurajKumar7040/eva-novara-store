const express = require("express");
const router = express.Router();

const { db } = require("../config/db");

// Get All Products
router.get("/", async (req, res) => {
    try {
        const [products] = await db.query(
            "SELECT * FROM products ORDER BY id ASC"
        );

        res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });

    } catch (error) {
        console.error("Products API Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch products"
        });
    }
});

module.exports = router;