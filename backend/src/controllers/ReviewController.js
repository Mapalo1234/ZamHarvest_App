const ReviewService = require("../services/ReviewService");
const BaseController = require("./BaseController");

/**
 * Review Controller
 * Handles HTTP requests for review operations
 */
class ReviewController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Test endpoint
   */
  test = this.asyncHandler(async (req, res) => {
    return this.sendSuccess(res, null, 'Review API is working!');
  });

  /**
   * Submit a review (buyers only)
   */
  submitReview = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer to submit reviews', 403);
    }

    const { orderId, productId, sellerId, rating, comment, experience, title, buyerId } = req.body;

    // Debug logging
    console.log('Review submission request:', {
      userId,
      role,
      orderId,
      productId,
      sellerId,
      rating,
      comment: comment ? comment.substring(0, 50) + '...' : null,
      experience,
      title,
      buyerId
    });

    // Use the buyerId from request body if provided, otherwise use session userId
    const finalBuyerId = buyerId || userId;

    try {
      const result = await ReviewService.submitReview({
        orderId,
        productId,
        sellerId,
        rating,
        comment,
        experience,
        title,
        buyerId: finalBuyerId
      });

      if (result && result.success === false) {
        return this.sendError(res, result.message || 'Service error', 400);
      }

      return this.sendSuccess(res, result, 'Review submitted successfully', 201);
    } catch (error) {
      console.error('Error in submitReview controller:', error);
      console.error('Error stack:', error.stack);
      return this.sendError(res, error.message || 'Internal server error', 500, error);
    }
  });

  /**
   * Get reviews for a seller
   */
  getSellerReviews = this.asyncHandler(async (req, res) => {
    console.log('getSellerReviews called with:', { 
      sellerId: req.params.sellerId, 
      url: req.url, 
      method: req.method,
      query: req.query 
    });
    
    const { sellerId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    await this.handleServiceResponse(
      res,
      ReviewService.getSellerReviews(sellerId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy
      }),
      'Seller reviews retrieved successfully'
    );
  });

  /**
   * Get reviews for a product
   */
  getProductReviews = this.asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    await this.handleServiceResponse(
      res,
      ReviewService.getProductReviews(productId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy
      }),
      'Product reviews retrieved successfully'
    );
  });

  /**
   * Get review by ID
   */
  getReviewById = this.asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    await this.handleServiceResponse(
      res,
      ReviewService.getReviewById(reviewId),
      'Review retrieved successfully'
    );
  });

  /**
   * Update a review (buyers only, own reviews)
   */
  updateReview = this.asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer to update reviews', 403);
    }

    const updateData = req.body;

    await this.handleServiceResponse(
      res,
      ReviewService.updateReview(reviewId, updateData, userId),
      'Review updated successfully'
    );
  });

  /**
   * Delete a review (buyers only, own reviews)
   */
  deleteReview = this.asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer to delete reviews', 403);
    }

    await this.handleServiceResponse(
      res,
      ReviewService.deleteReview(reviewId, userId),
      'Review deleted successfully'
    );
  });

  /**
   * Get review statistics for a seller
   */
  getSellerReviewStats = this.asyncHandler(async (req, res) => {
    const { sellerId } = req.params;

    await this.handleServiceResponse(
      res,
      ReviewService.getSellerReviewStats(sellerId),
      'Seller review statistics retrieved successfully'
    );
  });

  /**
   * Check if buyer can review an order
   */
  canReviewOrder = this.asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    await this.handleServiceResponse(
      res,
      ReviewService.canReviewOrder(orderId, userId),
      'Review eligibility checked successfully'
    );
  });

  /**
   * Get buyer's reviews
   */
  getBuyerReviews = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    const { page = 1, limit = 10 } = req.query;

    await this.handleServiceResponse(
      res,
      ReviewService.getBuyerReviews(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      }),
      'Buyer reviews retrieved successfully'
    );
  });

  /**
   * Get reviewable orders for buyer
   */
  getReviewableOrders = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    await this.handleServiceResponse(
      res,
      ReviewService.getReviewableOrders(userId),
      'Reviewable orders retrieved successfully'
    );
  });
}

module.exports = new ReviewController();
