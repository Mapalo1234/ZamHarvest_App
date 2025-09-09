const express = require("express");
const Request = require("../models/request");

const router = express.Router();

// Get all requests for a seller
router.get("/requests/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log("Fetching requests for sellerId:", sellerId);
    const requests = await Request.find({ seller: sellerId })
      .populate("buyer", "username email")
      .populate("product", "name price image")
      .populate("order")
      .sort({ createdAt: -1 });
    res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    console.error("Error fetching seller requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
