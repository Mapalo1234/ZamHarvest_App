const express = require("express");
const Order = require("../models/order");
const NotificationService = require("../utils/notificationService");

const router = express.Router();

// Payment processing route
router.post("/pay", async (req, res) => {
  const { amount, phone, reference } = req.body;
  console.log("Incoming request:", req.body);

  if (!amount || !phone || !reference) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get the callback URL (you'll need to replace this with your actual domain)
  const callbackUrl = `${req.protocol}://${req.get('host')}/payment-callback`;
  
  const payload = {
    auth: {
      api_id: "47a68b45-3dec-4616-9586-fab119a16030",
      merchant_id: "MEC01011",
      api_key: "d62f223f-b867-4412-8413-c288d62da930",
      channel: "API" // REQUIRED as per docs
    },
    data: {
      method: "runBillPayment",
      receiver_id: phone,
      reference_no: reference,
      amount: amount,
      callback_url:"https://7kr8rdgt-3000.uks1.devtunnels.ms/payment-callback"
    }
  };

  try {
    const response = await fetch("https://sandbox.zynlepay.com/zynlepay/jsonapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Payment API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    res.status(200).json({
      message: "Payment initiated",
      data
    });
  } catch (error) {
    console.error("Payment error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Payment callback route
router.post("/payment-callback", async (req, res) => {
  console.log("ZynlePay Callback Received:", req.body);

  const { reference_no, status, amount, transaction_id, message } = req.body;

  if (!reference_no || !status) {
    console.error("Invalid callback data:", req.body);
    return res.status(400).json({ error: "Invalid callback data" });
  }

  try {
    console.log(`Payment update for ${reference_no}: ${status}`);
    
    // Find the order by reference number
    const order = await Order.findOne({ orderId: reference_no });
    
    if (order) {
      // Update order payment status
      if (status === "success" || status === "completed") {
        order.paidStatus = "Paid";
        await order.save();
        
        // Create notification for seller about payment received
        await NotificationService.notifyPaymentReceived(order);
        
        // Create notification for buyer about payment confirmation
        await NotificationService.createNotification(
          order.buyerId,
          'Buyer',
          'payment_received',
          'Payment Confirmed',
          `Your payment of K${amount} for order ${reference_no} has been confirmed.`,
          {
            orderId: reference_no,
            amount: amount,
            transactionId: transaction_id
          }
        );
        
        console.log(`Order ${reference_no} marked as paid`);
      } else if (status === "failed" || status === "cancelled") {
        order.paidStatus = "Failed";
        await order.save();
        
        // Create notification for buyer about payment failure
        await NotificationService.createNotification(
          order.buyerId,
          'Buyer',
          'payment_failed',
          'Payment Failed',
          `Your payment for order ${reference_no} failed. Please try again.`,
          {
            orderId: reference_no,
            amount: amount
          }
        );
        
        console.log(`Order ${reference_no} marked as failed`);
      }
    } else {
      console.log(`Order not found for reference: ${reference_no}`);
    }
    
    res.status(200).json({ message: "Callback received successfully" });
  } catch (error) {
    console.error("Error handling callback:", error.message);
    res.status(200).json({ message: "Callback received but internal error" });
  }
});

// Test callback route for debugging
router.get("/test-callback", (req, res) => {
  console.log("Test callback endpoint hit");
  res.json({ 
    message: "Callback endpoint is working", 
    timestamp: new Date().toISOString(),
    url: req.originalUrl 
  });
});

// Manual payment status check route
router.get("/check-payment/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const order = await Order.findOne({ orderId: reference });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json({
      orderId: order.orderId,
      paidStatus: order.paidStatus,
      amount: order.totalPrice,
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error("Error checking payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
