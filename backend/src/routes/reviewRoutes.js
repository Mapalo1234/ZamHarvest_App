const express = require("express");
const ReviewController = require("../controllers/ReviewController");

const router = express.Router();

// Routes using controllers
router.get('/test', ReviewController.test);
router.post("/submit-review", ReviewController.submitReview);
router.get("/reviews/:sellerId", ReviewController.getSellerReviews);

// API endpoints
router.post("/api/reviews", ReviewController.submitReview);
router.get("/api/reviews/seller/:sellerId", ReviewController.getSellerReviews);
router.get("/api/reviews/product/:productId", ReviewController.getProductReviews);
router.get("/api/reviews/:reviewId", ReviewController.getReviewById);
router.put("/api/reviews/:reviewId", ReviewController.updateReview);
router.delete("/api/reviews/:reviewId", ReviewController.deleteReview);
router.get("/api/reviews/seller/:sellerId/stats", ReviewController.getSellerReviewStats);
router.get("/api/reviews/order/:orderId/can-review", ReviewController.canReviewOrder);
router.get("/api/reviews/buyer/my-reviews", ReviewController.getBuyerReviews);

module.exports = router;