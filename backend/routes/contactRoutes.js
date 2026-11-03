const express = require("express");
const router = express.Router();

const { db } = require("../config/db");

// Submit Contact Message
router.post("/", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Save message in MySQL
        const [result] = await db.query(
            `INSERT INTO contact_messages
            (name, email, subject, message)
            VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
                email.trim(),
                subject.trim(),
                message.trim()
            ]
        );

        res.status(201).json({
            success: true,
            message: "Your message has been submitted successfully!",
            messageId: result.insertId
        });

    } catch (error) {
        console.error("Contact API Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to submit your message"
        });
    }
});

module.exports = router;