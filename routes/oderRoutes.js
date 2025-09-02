const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

//  Create Order when user clicks Purchase
router.post("/create-order", async (req, res) => {
    try {
        const { customerId, sellerId, productId, price } = req.body;

        const orderId = "ORD" + Math.floor(100000 + Math.random() * 900000);

        const order = new Order({
            customerId,
            sellerId,
            productId,
            price,
            orderId
        });

        await order.save();
        res.json({ success: true, message: "Order created", order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to create order" });
    }
});

//  Get all orders for logged-in customer
router.get("/my-orders", async (req, res) => {
    try {
        const customerId = req.session.user._id; // Assuming session-based auth
        const orders = await Order.find({ customerId })
            .populate("sellerId", "name")
            .populate("productId", "title image");

        res.render("orders", { orders });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching orders");
    }
});

module.exports = router;
