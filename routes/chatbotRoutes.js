// routes/chatbotRoutes.js
const express = require("express");
const router = express.Router();
const { sendMessage } = require("../controllers/chatbotController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/chatbot/message  — protected, patients only
router.post("/message", protect, sendMessage);

module.exports = router;
