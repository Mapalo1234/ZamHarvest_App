const express = require("express");
const ReviewController = require("../controllers/ReviewController");

const router = express.Router();

// Routes using controllers
router.get('/test', ReviewController.test);
router.post("/submit-review", ReviewController.submitReview);

// Test route for debugging
router.get('/test-seller-reviews', (req, res) => {
  res.json({ message: 'Seller reviews endpoint is accessible', timestamp: new Date().toISOString() });
});

// Test route for review submission debugging
router.post('/test-submit-review', (req, res) => {
  console.log('Test review submission received:', req.body);
  res.json({ 
    message: 'Test review submission received', 
    receivedData: req.body,
    timestamp: new Date().toISOString() 
  });
});

// Test route to check all reviews in database
router.get('/test-all-reviews', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const allReviews = await Review.find({}).populate('sellerId', 'username').populate('buyerId', 'username').lean();
    res.json({ 
      message: 'All reviews in database', 
      count: allReviews.length,
      reviews: allReviews 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoints (mounted at /api, so no need for /api prefix)
// Order matters - more specific routes first
router.get("/reviews/seller/:sellerId", ReviewController.getSellerReviews);
router.get("/reviews/seller/:sellerId/stats", ReviewController.getSellerReviewStats);
router.get("/reviews/product/:productId", ReviewController.getProductReviews);
router.get("/reviews/order/:orderId/can-review", ReviewController.canReviewOrder);
router.get("/reviews/buyer/my-reviews", ReviewController.getBuyerReviews);
router.get("/reviewable-orders", ReviewController.getReviewableOrders);
router.post("/reviews", ReviewController.submitReview);
router.post("/submit-review", ReviewController.submitReview); // Legacy endpoint
router.get("/reviews/:reviewId", ReviewController.getReviewById);
router.put("/reviews/:reviewId", ReviewController.updateReview);
router.delete("/reviews/:reviewId", ReviewController.deleteReview);

module.exports = router;