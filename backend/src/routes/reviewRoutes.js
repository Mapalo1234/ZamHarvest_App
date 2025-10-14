const express = require("express");
const ReviewController = require("../controllers/ReviewController");
const { apiAuth, apiAuthBuyer } = require("../middleware/apiAuth");

const router = express.Router();

// Test routes (must be before parameterized routes)
router.get('/test', ReviewController.test);
router.get('/test-seller-reviews', (req, res) => {
  res.json({ message: 'Seller reviews endpoint is accessible', timestamp: new Date().toISOString() });
});
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
// Order matters - more specific routes first, generic routes last
router.get("/reviews/seller/:sellerId", ReviewController.getSellerReviews);
router.get("/reviews/seller/:sellerId/stats", ReviewController.getSellerReviewStats);
router.get("/reviews/product/:productId", ReviewController.getProductReviews);
router.get("/reviews/order/:orderId/can-review", apiAuthBuyer, ReviewController.canReviewOrder);
router.get("/reviews/buyer/my-reviews", apiAuthBuyer, ReviewController.getBuyerReviews);
router.get("/reviewable-orders", apiAuthBuyer, ReviewController.getReviewableOrders);
router.post("/reviews", apiAuthBuyer, ReviewController.submitReview);
router.post("/submit-review", apiAuthBuyer, ReviewController.submitReview); // Legacy endpoint
router.put("/reviews/:reviewId", apiAuthBuyer, ReviewController.updateReview);
router.delete("/reviews/:reviewId", apiAuthBuyer, ReviewController.deleteReview);
router.get("/reviews/:reviewId", ReviewController.getReviewById); // This should be last to avoid conflicts

module.exports = router;