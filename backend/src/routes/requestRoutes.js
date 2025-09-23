const express = require("express");
const Request = require("../models/request");

const router = express.Router();

// Get all requests for the current seller (using session)
router.get("/my-requests", async (req, res) => {
  try {
    // Check if user is authenticated as a seller
    if (!req.session.userId || req.session.role !== 'seller') {
      return res.status(403).json({ error: "Please log in as a seller to view requests" });
    }
    
    const sellerId = req.session.userId;
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

// Get all requests for a seller (legacy route with sellerId in URL)
router.get("/requests/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Verify the sellerId matches the session user
    if (req.session.userId !== sellerId || req.session.role !== 'seller') {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    
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
