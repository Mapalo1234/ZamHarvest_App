const express = require("express");
const PaymentController = require("../controllers/PaymentController");

const router = express.Router();

// Routes using controllers
router.post("/pay", PaymentController.processPayment);
router.post("/payment-callback", PaymentController.paymentCallback);
router.get("/check-payment/:reference", PaymentController.checkPaymentStatus);

// API endpoints
router.post("/api/payments", PaymentController.processPayment);
router.post("/api/payments/callback", PaymentController.paymentCallback);
router.get("/api/payments/:reference/status", PaymentController.checkPaymentStatus);
router.get("/api/payments/history", PaymentController.getPaymentHistory);
router.post("/api/payments/:orderId/refund", PaymentController.refundPayment);

module.exports = router;