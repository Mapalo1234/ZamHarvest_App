const Review = require("../models/Review");
const Order = require("../models/order");
const Seller = require("../models/seller");
const Product = require("../models/Product");
const BaseService = require("./BaseService");

/**
 * Review Service
 * Handles review management and business logic
 */
class ReviewService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Submit a review
   * @param {Object} reviewData - Review data
   * @returns {Object} Created review
   */
  async submitReview(reviewData) {
    try {
      this.log('submitReview', reviewData);

      const { orderId, productId, sellerId, rating, comment, experience, title, buyerId } = reviewData;

      // Validate required fields based on review type
      if (orderId) {
        this.validateRequired(reviewData, ['orderId', 'rating', 'comment', 'experience', 'buyerId']);
        return await this.submitOrderReview(reviewData);
      } else if (productId && sellerId) {
        this.validateRequired(reviewData, ['productId', 'sellerId', 'rating', 'comment', 'experience', 'buyerId']);
        return await this.submitProductReview(reviewData);
      } else {
        throw new Error("Either orderId or (productId and sellerId) must be provided");
      }

    } catch (error) {
      console.error('Error in submitReview service:', error);
      console.error('Review data:', reviewData);
      this.handleError(error, 'submitReview');
    }
  }

  /**
   * Submit an order review
   * @param {Object} reviewData - Review data
   * @returns {Object} Created review
   */
  async submitOrderReview(reviewData) {
    try {
      const { orderId, rating, comment, experience, title, buyerId } = reviewData;

      console.log('submitOrderReview called with:', { orderId, rating, comment, experience, title, buyerId });

      // Validate rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          message: "Rating must be between 1 and 5"
        };
      }

    // Find and validate order
    const order = await Order.findById(orderId)
      .populate('productId')
      .populate('sellerId');

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.productId || !order.sellerId) {
       throw new Error("Order is missing product or seller information");
    }

    // Check if buyer owns this order
    if (order.buyerId.toString() !== buyerId) {
      return {
        success: false,
        message: "You can only review your own orders"
      };
    }

    // Check if order is delivered and paid
    if (order.deliveryStatus !== 'Delivered' || order.paidStatus !== 'Paid') {
      return {
        success: false,
        message: "You can only review delivered and paid orders"
      };
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      buyerId,
      orderId
    });

    if (existingReview) {
      return {
        success: false,
        message: "You have already reviewed this order"
      };
    }

    // Create review
const review = new Review({
  buyerId,
  sellerId: order.sellerId._id,
  orderId,
  productId: order.productId._id,
  rating,
  comment,
  experience,
  title: title || '',
  isVerified: true
});

    await review.save();

    // Update seller's average rating
    await this.updateSellerRating(order.sellerId._id);

    // Mark order as reviewed
    order.canReview = false;
    await order.save();

    this.log('submitOrderReview completed', { reviewId: review._id });
    return review;
    } catch (error) {
      console.error('Error in submitOrderReview:', error);
      throw error;
    }
  }

  /**
   * Submit a product review (simplified - for demonstration)
   * @param {Object} reviewData - Review data
   * @returns {Object} Created review
   */
  async submitProductReview(reviewData) {
    try {
      const { productId, sellerId, rating, comment, experience, title, buyerId } = reviewData;

      console.log('submitProductReview called with:', { productId, sellerId, rating, comment, experience, title, buyerId });

      // Validate rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          message: "Rating must be between 1 and 5"
        };
      }

    // Check if review already exists for this product by this buyer
    const existingReview = await Review.findOne({
      buyerId,
      productId
    });

    if (existingReview) {
      return {
        success: false,
        message: "You have already reviewed this product"
      };
    }

    // Create review (without orderId for product reviews)
    const review = new Review({
      buyerId,
      sellerId,
      productId,
      rating,
      comment,
      experience,
      title: title || '',
      isVerified: true
    });

    await review.save();

    // Update seller's average rating
    await this.updateSellerRating(sellerId);

    // Send notifications
    const NotificationService = require("./NotificationService");
    
    // Get product and seller details for notifications
    const product = await Product.findById(productId).select('name');
    const seller = await Seller.findById(sellerId).select('username');
    const buyer = await require("../models/buyer").findById(buyerId).select('username');

    // Notify seller about new review
    await NotificationService.createNotification(
      sellerId,
      'seller',
      'seller_rated',
      'New Review Received',
      `You received a ${rating}-star review from ${buyer?.username || 'a buyer'} for "${product?.name || 'your product'}".`,
      {
        reviewId: review._id,
        productId: productId,
        rating: rating,
        buyerName: buyer?.username,
        productName: product?.name
      }
    );

    // Notify buyer about review submission
    await NotificationService.createNotification(
      buyerId,
      'buyer',
      'review_submitted',
      'Review Submitted',
      `Thank you! Your ${rating}-star review for "${product?.name || 'the product'}" has been submitted successfully.`,
      {
        reviewId: review._id,
        productId: productId,
        rating: rating,
        productName: product?.name
      }
    );

    this.log('submitProductReview completed', { reviewId: review._id });
    return review;
    } catch (error) {
      console.error('Error in submitProductReview:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a seller
   * @param {string} sellerId - Seller ID
   * @param {Object} options - Query options
   * @returns {Object} Reviews with pagination
   */
  async getSellerReviews(sellerId, options = {}) {
    try {
      console.log('ReviewService.getSellerReviews called with:', { sellerId, options });
      this.log('getSellerReviews', { sellerId, options });

      const { page = 1, limit = 10, sortBy = 'newest' } = options;

      let sortOption = { createdAt: -1 };
      switch (sortBy) {
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'highest':
          sortOption = { rating: -1, createdAt: -1 };
          break;
        case 'lowest':
          sortOption = { rating: 1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }

      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ sellerId, isVisible: true })
          .populate('buyerId', 'username')
          .populate('productId', 'name image')
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments({ sellerId, isVisible: true })
      ]);

      console.log('Found reviews:', { count: reviews.length, total, sellerId });
      console.log('Reviews data:', reviews);

      const result = {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      this.log('getSellerReviews completed', { count: reviews.length, total });
      return result;

    } catch (error) {
      this.handleError(error, 'getSellerReviews');
    }
  }

  /**
   * Get reviews for a product
   * @param {string} productId - Product ID
   * @param {Object} options - Query options
   * @returns {Object} Reviews with pagination
   */
  async getProductReviews(productId, options = {}) {
    try {
      this.log('getProductReviews', { productId, options });

      const { page = 1, limit = 10, sortBy = 'newest' } = options;

      let sortOption = { createdAt: -1 };
      switch (sortBy) {
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'highest':
          sortOption = { rating: -1, createdAt: -1 };
          break;
        case 'lowest':
          sortOption = { rating: 1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }

      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ productId, isVisible: true })
          .populate('buyerId', 'username')
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments({ productId, isVisible: true })
      ]);

      const result = {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      this.log('getProductReviews completed', { count: reviews.length, total });
      return result;

    } catch (error) {
      this.handleError(error, 'getProductReviews');
    }
  }

  /**
   * Get review by ID
   * @param {string} reviewId - Review ID
   * @returns {Object} Review data
   */
  async getReviewById(reviewId) {
    try {
      this.log('getReviewById', { reviewId });

      const review = await Review.findById(reviewId)
        .populate('buyerId', 'username')
        .populate('sellerId', 'username')
        .populate('productId', 'name image')
        .populate('orderId', 'orderId totalPrice');

      if (!review) {
        throw new Error("Review not found");
      }

      this.log('getReviewById completed', { reviewId });
      return review;

    } catch (error) {
      this.handleError(error, 'getReviewById');
    }
  }

  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {Object} updateData - Update data
   * @param {string} buyerId - Buyer ID (for authorization)
   * @returns {Object} Updated review
   */
  async updateReview(reviewId, updateData, buyerId) {
    try {
      this.log('updateReview', { reviewId, buyerId });

      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      // Check ownership
      if (review.buyerId.toString() !== buyerId) {
        throw new Error("You can only update your own reviews");
      }

      // Validate rating if provided
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Update allowed fields
      const allowedFields = ['rating', 'comment', 'experience', 'title'];
      const updates = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      updates.updatedAt = new Date();

      Object.assign(review, updates);
      await review.save();

      // Update seller's average rating if rating changed
      if (updateData.rating) {
        await this.updateSellerRating(review.sellerId);
      }

      this.log('updateReview completed', { reviewId });
      return review;

    } catch (error) {
      this.handleError(error, 'updateReview');
    }
  }

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @param {string} buyerId - Buyer ID (for authorization)
   * @returns {Object} Deletion result
   */
  async deleteReview(reviewId, buyerId) {
    try {
      this.log('deleteReview', { reviewId, buyerId });

      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      // Check ownership
      if (review.buyerId.toString() !== buyerId) {
        throw new Error("You can only delete your own reviews");
      }

      const sellerId = review.sellerId;
      await Review.findByIdAndDelete(reviewId);

      // Update seller's average rating
      await this.updateSellerRating(sellerId);

      // Allow buyer to review again
      await Order.findByIdAndUpdate(review.orderId, { canReview: true });

      this.log('deleteReview completed', { reviewId });
      return {
        success: true,
        message: "Review deleted successfully"
      };

    } catch (error) {
      this.handleError(error, 'deleteReview');
    }
  }

  /**
   * Get seller review statistics
   * @param {string} sellerId - Seller ID
   * @returns {Object} Review statistics
   */
  async getSellerReviewStats(sellerId) {
    try {
      this.log('getSellerReviewStats', { sellerId });

      const stats = await Review.aggregate([
        {
          $match: {
            sellerId: sellerId,
            isVisible: true
          }
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: []
      };

      // Calculate rating distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      result.ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });

      result.ratingDistribution = distribution;
      result.averageRating = Math.round(result.averageRating * 10) / 10;

      this.log('getSellerReviewStats completed', result);
      return result;

    } catch (error) {
      this.handleError(error, 'getSellerReviewStats');
    }
  }

  /**
   * Check if buyer can review an order
   * @param {string} orderId - Order ID
   * @param {string} buyerId - Buyer ID
   * @returns {Object} Review eligibility
   */
  async canReviewOrder(orderId, buyerId) {
    try {
      this.log('canReviewOrder', { orderId, buyerId });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check ownership
      if (order.buyerId.toString() !== buyerId) {
        throw new Error("You can only check your own orders");
      }

      const canReview = order.deliveryStatus === 'Delivered' && 
                       order.paidStatus === 'Paid' && 
                       order.canReview;

      // Check if already reviewed
      const existingReview = await Review.findOne({ buyerId, orderId });

      const result = {
        canReview: canReview && !existingReview,
        reasons: {
          orderDelivered: order.deliveryStatus === 'Delivered',
          orderPaid: order.paidStatus === 'Paid',
          reviewAllowed: order.canReview,
          alreadyReviewed: !!existingReview
        }
      };

      this.log('canReviewOrder completed', result);
      return result;

    } catch (error) {
      this.handleError(error, 'canReviewOrder');
    }
  }

  /**
   * Get buyer's reviews
   * @param {string} buyerId - Buyer ID
   * @param {Object} options - Query options
   * @returns {Object} Reviews with pagination
   */
  async getBuyerReviews(buyerId, options = {}) {
    try {
      this.log('getBuyerReviews', { buyerId, options });

      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ buyerId })
          .populate('sellerId', 'username')
          .populate('productId', 'name image')
          .populate('orderId', 'orderId totalPrice')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments({ buyerId })
      ]);

      const result = {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      this.log('getBuyerReviews completed', { count: reviews.length, total });
      return result;

    } catch (error) {
      this.handleError(error, 'getBuyerReviews');
    }
  }

  /**
   * Get reviewable orders for a buyer
   * @param {string} buyerId - Buyer ID
   * @returns {Object} Reviewable orders
   */
  async getReviewableOrders(buyerId) {
    try {
      this.log('getReviewableOrders', { buyerId });

      const orders = await Order.find({
        buyerId,
        deliveryStatus: 'Delivered',
        paidStatus: 'Paid',
        canReview: true
      })
        .populate('productId', 'name image')
        .populate('sellerId', 'username')
        .sort({ deliveredAt: -1 })
        .lean();

      // Filter out orders that already have reviews
      const reviewableOrders = [];
      for (const order of orders) {
        const existingReview = await Review.findOne({
          buyerId,
          orderId: order._id
        });
        
        if (!existingReview) {
          reviewableOrders.push(order);
        }
      }

      this.log('getReviewableOrders completed', { count: reviewableOrders.length });
      return { orders: reviewableOrders };

    } catch (error) {
      this.handleError(error, 'getReviewableOrders');
    }
  }

  /**
   * Update seller's average rating
   * @param {string} sellerId - Seller ID
   * @returns {Object} Update result
   */
  async updateSellerRating(sellerId) {
    try {
      this.log('updateSellerRating', { sellerId });

      const stats = await Review.aggregate([
        {
          $match: {
            sellerId: sellerId,
            isVisible: true
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      const { averageRating = 0, totalReviews = 0 } = stats[0] || {};

      await Seller.findByIdAndUpdate(sellerId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      });

      this.log('updateSellerRating completed', { 
        sellerId, 
        averageRating, 
        totalReviews 
      });

      return { averageRating, totalReviews };

    } catch (error) {
      this.handleError(error, 'updateSellerRating');
    }
  }
}

module.exports = new ReviewService();
