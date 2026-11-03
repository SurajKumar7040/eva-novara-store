const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { testConnection } = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const contactRoutes = require("./routes/contactRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve uploaded product images
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);

// Backend Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "EVA NOVARA Backend Server is Running!"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`EVA NOVARA Server running on port ${PORT}`);
    await testConnection();
});