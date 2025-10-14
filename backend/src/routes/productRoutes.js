const express = require("express");
const ProductController = require("../controllers/ProductController");
const { ensureSeller } = require("./authRoutes");

const router = express.Router();

// Routes using controllers (backward compatibility)
router.get("/products", ProductController.getProducts);
router.get("/products-test", ProductController.getAllProducts);
router.post("/submit-product", ensureSeller, ProductController.createProduct);
router.delete("/product/:id", ensureSeller, ProductController.deleteProduct);
router.put("/product/:id", ensureSeller, ProductController.updateProduct);

// API endpoints
router.get("/api/products", ProductController.getProducts);
router.post("/api/products", ProductController.createProduct);
router.get("/api/products/search", ProductController.searchProducts);
router.get("/api/products/categories", ProductController.getCategories);
router.get("/api/products/provinces", ProductController.getProvinces);
router.get("/api/products/:id", ProductController.getProductById);
router.put("/api/products/:id", ProductController.updateProduct);
router.delete("/api/products/:id", ProductController.deleteProduct);
router.get("/api/products/:id/availability", ProductController.checkAvailability);

module.exports = router;