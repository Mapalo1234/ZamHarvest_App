const express = require("express");
const ReceiptController = require("../controllers/ReceiptController");

const router = express.Router();

// Routes using controllers
router.get("/receipt/:orderId", ReceiptController.getReceipt);

// API endpoints
router.get("/api/receipts/:orderId", ReceiptController.getReceipt);
router.get("/api/receipts/:orderId/pdf", ReceiptController.generateReceiptPDF);
router.post("/api/receipts/:orderId/email", ReceiptController.emailReceipt);
router.get("/api/receipts/history", ReceiptController.getReceiptHistory);
router.get("/api/receipts/verify/:receiptId", ReceiptController.verifyReceipt);
router.get("/api/receipts/stats", ReceiptController.getReceiptStats);

module.exports = router;