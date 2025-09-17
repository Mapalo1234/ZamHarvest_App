const express = require("express");
const Product = require("../models/Product");
const { ensureSeller } = require("./authRoutes");

const router = express.Router();

// Get products route
router.get("/products", async (req, res) => {
  if (!req.session.userId) return res.status(401).send("Please log in");

  const role = req.session.role;
  let products;

  if (role === "buyer") {
    products = await Product.find({}).populate("sellerId", "username"); 
  } else if (role === "seller") {
    products = await Product.find({ sellerId: req.session.userId }).populate("sellerId", "username"); 
  } else {
    return res.status(403).send("Access denied");
  }

  res.json(products);
});

// Test products route
router.get("/products-test", async (req, res) => {
  try {
    const products = await Product.find({}).populate("sellerId", "username");
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Submit product (sellers only)
router.post("/submit-product", ensureSeller, async (req, res) => {
  try {
    // Get seller information from session
    const Seller = require("../models/seller");
    const seller = await Seller.findById(req.session.userId);
    
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const product = { 
      ...req.body, 
      sellerId: req.session.userId,
      sellername: seller.username // Add seller name
    };
    
    await Product.create(product);
    res.send("Product submitted");
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete product (sellers only)
router.delete("/product/:id", ensureSeller, async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product || product.sellerId.toString() !== req.session.userId) {
    return res.status(403).send("Unauthorized");
  }

  await Product.findByIdAndDelete(id);
  res.send("Deleted successfully");
});

// Edit product (sellers only)
router.put("/product/:id", ensureSeller, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const product = await Product.findById(id);
    if (!product || product.sellerId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized");
    }

    await Product.findByIdAndUpdate(id, updates, { new: true });
    res.send("Product updated successfully");
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
