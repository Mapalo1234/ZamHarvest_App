const express = require("express");
const OrderController = require("../controllers/OrderController");

const router = express.Router();

// Routes using controllers (backward compatibility)
router.post("/create-order", OrderController.createOrder);
router.get("/orders/:buyerId", OrderController.getOrdersByBuyer);
router.delete("/orders/:id", OrderController.cancelOrder);
router.delete("/orders/:id/delete", OrderController.deleteOrder);
router.put("/orders/:id/status", OrderController.updateOrderStatus);

// API endpoints
router.get("/api/orders", OrderController.getUserOrders);
router.get("/api/orders/buyer", OrderController.getOrdersByBuyer);
router.get("/api/orders/seller", OrderController.getOrdersBySeller);
router.get("/api/orders/statistics", OrderController.getOrderStatistics);
router.get("/api/orders/:id", OrderController.getOrderById);
router.put("/api/orders/:id", OrderController.updateOrderStatus);
router.put("/api/confirm-delivery/:orderId", OrderController.confirmDelivery);
router.delete("/api/orders/:id", OrderController.cancelOrder);
router.post("/api/orders", OrderController.createOrder);

module.exports = router;