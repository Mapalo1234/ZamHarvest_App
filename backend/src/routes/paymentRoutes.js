const express = require("express");

const router = express.Router();

// Payment processing route
router.post("/pay", async (req, res) => {
  const { amount, phone, reference } = req.body;
  console.log("Incoming request:", req.body);

  if (!amount || !phone || !reference) {
    return res.status(400).json({ error: "Missing required fields" });
  }

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
      amount: amount
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
router.post("/payment-callback", (req, res) => {
  console.log("ZynlePay Callback Received:", req.body);

  const { reference_no, status, amount, transaction_id } = req.body;

  if (!reference_no || !status) {
    return res.status(400).json({ error: "Invalid callback data" });
  }

  try {
    console.log(`Payment update for ${reference_no}: ${status}`);
    res.status(200).json({ message: "Callback received successfully" });
  } catch (error) {
    console.error("Error handling callback:", error.message);
    res.status(200).json({ message: "Callback received but internal error" });
  }
});

module.exports = router;
