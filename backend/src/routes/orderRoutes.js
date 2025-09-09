const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/order");
const Request = require("../models/request");

const router = express.Router();

// Create order (buyers only)
router.post("/create-order", async (req, res) => {
  try {
  const { productId, quantity, deliveryDate, totalPrice, productName, productImage, userId, userName, unit } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid or missing productId" });
    }

    if (!deliveryDate) {
      return res.status(400).json({ error: "Delivery date is required" });
    }

    // Fetch product to get seller details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get sellerId and sellername from product
    const sellerId = product.sellerId;
    const sellerName = product.sellername || "Unknown Seller";

    // Create order
    const order = new Order({
      orderId: `ORD-${Date.now()}`,
      buyerId: userId,
      productId,
      productName,
      image: productImage,
      totalPrice,
      deliveryDate,
      quantity,
      unit,
      username: userName, // buyer name
      sellerId,
      sellerName, // now storing actual seller name
      paidStatus: "Pending"
    });

    await order.save();

    // Create a request for the seller
    const request = new Request({
      seller: sellerId,
      buyer: userId,
      product: productId,
      order: order._id,
      status: "pending"
    });
    await request.save();

    res.status(201).json({ message: "Order and request created successfully", order });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get orders by buyer ID
router.get("/orders/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;

    // Validate ObjectId
    if (!buyerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid buyerId" });
    }

    const orders = await Order.find({ buyerId })
      .populate("productId", "name price image sellername")
      .populate("sellerId", "username email")
      .sort({ createdAt: -1 }) // Sort by newest first
      .exec();

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    // Format orders for better frontend consumption
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      productName: order.productName,
      productImage: order.image,
      totalPrice: order.totalPrice,
      quantity: order.quantity,
      sellerName: order.sellerName || order.productId?.sellername || "Unknown Seller",
      sellerId: order.sellerId,
      paidStatus: order.paidStatus,
      deliveryDate: order.deliveryDate,
      createdAt: order.createdAt
    }));

    res.status(200).json({ count: formattedOrders.length, orders: formattedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete order
router.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Order deleted successfully", deletedOrder });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
