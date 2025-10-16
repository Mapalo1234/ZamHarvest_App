const Product = require("../models/Product");
const Seller = require("../models/seller");
const BaseService = require("./BaseService");
const { AppError } = require("../utils/ErrorHandler");

/**
 * Product Service
 * Handles product management, CRUD operations, and business logic
 */
class ProductService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get products based on user role
   * @param {string} userId - User ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Array} Array of products
   */
  async getProducts(userId, role) {
    try {
      this.log('getProducts', { userId, role });

      let products;

      if (role === "buyer") {
        // Buyers see all available products except dummy messaging products
        products = await Product.find({ 
          isDummyProduct: { $ne: true },
          isActive: true
        }).populate("sellerId", "username averageRating totalReviews totalPoints");
      } else if (role === "seller") {
        // Sellers see only their own products
        products = await Product.find({ 
          sellerId: userId,
          isDummyProduct: { $ne: true }
        }).populate("sellerId", "username averageRating totalReviews totalPoints");
      } else {
        throw new AppError("Invalid user role", 400);
      }

      this.log('getProducts completed', { count: products.length });
      return products;
    } catch (error) {
      this.handleError(error, 'getProducts');
    }
  }

  /**
   * Get all products (test/admin endpoint)
   * @returns {Array} Array of all products
   */
  async getAllProducts() {
    try {
      this.log('getAllProducts');
      
      const products = await Product.find({}).populate("sellerId", "username");
      
      this.log('getAllProducts completed', { count: products.length });
      return products;
    } catch (error) {
      this.handleError(error, 'getAllProducts');
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @param {string} sellerId - Seller ID
   * @returns {Object} Created product
   */
  async createProduct(productData, sellerId) {
    try {
      this.log('createProduct', { sellerId, productName: productData.name });

      // Validate required fields
      const requiredFields = ['name', 'description', 'price', 'category', 'province', 'location', 'image'];
      this.validateRequired(productData, requiredFields);

      // Get seller information
      const seller = await Seller.findById(sellerId);
      if (!seller) {
        throw new AppError("Seller not found", 404);
      }

      // Prepare product data
      const newProductData = {
        ...productData,
        sellerId: sellerId,
        sellername: seller.username,
        stock: productData.stock || 0,
        unit: productData.unit || "kg",
        organicStatus: productData.organicStatus || "Non-Organic",
        availability: productData.availability || "Available",
        isActive: true,
        isDummyProduct: false
      };

      // Handle promotion data
      if (productData.isOnPromotion && productData.promoPrice) {
        newProductData.isOnPromotion = true;
        newProductData.promoPrice = productData.promoPrice;
        if (productData.promotionEndDate) {
          newProductData.promotionEndDate = new Date(productData.promotionEndDate);
        }
      }

      // Handle dates
      if (productData.harvestDate) {
        newProductData.harvestDate = new Date(productData.harvestDate);
      }
      if (productData.expiryDate) {
        newProductData.expiryDate = new Date(productData.expiryDate);
      }

      // Create product
      const product = new Product(newProductData);
      await product.save();

      // Populate seller information for response
      await product.populate("sellerId", "username averageRating totalReviews totalPoints");

      // Send notification to seller about successful product creation
      const NotificationService = require("./NotificationService");
      await NotificationService.createNotification(
        sellerId,
        'seller',
        'product_added',
        'Product Added Successfully',
        `Your product "${product.name}" has been added to the marketplace and is now available for buyers.`,
        {
          productId: product._id,
          productName: product.name,
          category: product.category,
          price: product.price
        }
      );

      this.log('createProduct completed', { productId: product._id });
      return product;
    } catch (error) {
      this.handleError(error, 'createProduct');
    }
  }

  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Object} Product data
   */
  async getProductById(productId) {
    try {
      this.log('getProductById', { productId });

      if (!productId) {
        throw new AppError("Product ID is required", 400);
      }

      const product = await Product.findById(productId)
        .populate("sellerId", "username averageRating totalReviews totalPoints");

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      this.log('getProductById completed', { productId: product._id });
      return product;
    } catch (error) {
      this.handleError(error, 'getProductById');
    }
  }

  /**
   * Update product
   * @param {string} productId - Product ID
   * @param {Object} updateData - Data to update
   * @param {string} sellerId - Seller ID (for authorization)
   * @returns {Object} Updated product
   */
  async updateProduct(productId, updateData, sellerId) {
    try {
      this.log('updateProduct', { productId, sellerId });

      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError("Product not found", 404);
      }

      // Verify ownership
      if (product.sellerId.toString() !== sellerId) {
        throw new AppError("Unauthorized: You can only update your own products", 403);
      }

      // Update product
      Object.assign(product, updateData);
      await product.save();

      // Populate seller information
      await product.populate("sellerId", "username averageRating totalReviews totalPoints");

      this.log('updateProduct completed', { productId: product._id });
      return product;
    } catch (error) {
      this.handleError(error, 'updateProduct');
    }
  }

  /**
   * Delete product
   * @param {string} productId - Product ID
   * @param {string} sellerId - Seller ID (for authorization)
   * @returns {Object} Deletion result
   */
  async deleteProduct(productId, sellerId) {
    try {
      this.log('deleteProduct', { productId, sellerId });

      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError("Product not found", 404);
      }

      // Verify ownership
      if (product.sellerId.toString() !== sellerId) {
        throw new AppError("Unauthorized: You can only delete your own products", 403);
      }

      // Check for related records that might prevent deletion
      const Order = require("../models/order");
      const Review = require("../models/Review");
      const Message = require("../models/Message");
      
      // Check for active orders
      const activeOrders = await Order.find({ 
        productId: productId,
        deliveryStatus: { $nin: ['Delivered', 'Cancelled'] }
      });
      
      if (activeOrders.length > 0) {
        throw new AppError(`Cannot delete product: There are ${activeOrders.length} active orders for this product. Please complete or cancel these orders first.`, 400);
      }

      // Check for pending orders
      const pendingOrders = await Order.find({ 
        productId: productId,
        paidStatus: 'Pending'
      });
      
      if (pendingOrders.length > 0) {
        throw new AppError(`Cannot delete product: There are ${pendingOrders.length} pending orders for this product. Please complete or cancel these orders first.`, 400);
      }

      // Delete related records first (cascade delete)
      // Delete reviews for this product
      await Review.deleteMany({ productId: productId });
      this.log('Deleted reviews for product', { productId, deletedCount: 'multiple' });

      // Delete messages for this product
      await Message.deleteMany({ productId: productId });
      this.log('Deleted messages for product', { productId, deletedCount: 'multiple' });

      // Delete completed/delivered orders for this product (keep for historical records)
      // Note: We'll keep delivered orders for historical purposes, but delete pending ones
      await Order.deleteMany({ 
        productId: productId,
        deliveryStatus: { $in: ['Delivered', 'Cancelled'] }
      });
      this.log('Deleted historical orders for product', { productId, deletedCount: 'multiple' });

      // Now delete the product
      await Product.findByIdAndDelete(productId);

      this.log('deleteProduct completed', { productId });
      return { success: true, message: "Product deleted successfully" };
    } catch (error) {
      this.handleError(error, 'deleteProduct');
    }
  }

  /**
   * Search products
   * @param {Object} searchCriteria - Search criteria
   * @param {string} searchCriteria.query - Search query
   * @param {string} searchCriteria.category - Category filter
   * @param {string} searchCriteria.province - Province filter
   * @param {number} searchCriteria.minPrice - Minimum price
   * @param {number} searchCriteria.maxPrice - Maximum price
   * @param {string} searchCriteria.organicStatus - Organic status filter
   * @returns {Array} Array of matching products
   */
  async searchProducts(searchCriteria) {
    try {
      this.log('searchProducts', searchCriteria);

      const filter = {
        isDummyProduct: { $ne: true },
        isActive: true
      };

      // Text search
      if (searchCriteria.query) {
        filter.$or = [
          { name: { $regex: searchCriteria.query, $options: 'i' } },
          { description: { $regex: searchCriteria.query, $options: 'i' } },
          { category: { $regex: searchCriteria.query, $options: 'i' } }
        ];
      }

      // Category filter
      if (searchCriteria.category) {
        filter.category = searchCriteria.category;
      }

      // Province filter
      if (searchCriteria.province) {
        filter.province = searchCriteria.province;
      }

      // Price range filter
      if (searchCriteria.minPrice || searchCriteria.maxPrice) {
        filter.price = {};
        if (searchCriteria.minPrice) {
          filter.price.$gte = searchCriteria.minPrice;
        }
        if (searchCriteria.maxPrice) {
          filter.price.$lte = searchCriteria.maxPrice;
        }
      }

      // Organic status filter
      if (searchCriteria.organicStatus) {
        filter.organicStatus = searchCriteria.organicStatus;
      }

      const products = await Product.find(filter)
        .populate("sellerId", "username averageRating totalReviews totalPoints")
        .sort({ createdAt: -1 });

      this.log('searchProducts completed', { count: products.length });
      return products;
    } catch (error) {
      this.handleError(error, 'searchProducts');
    }
  }

  /**
   * Check product availability
   * @param {string} productId - Product ID
   * @param {number} requestedQuantity - Requested quantity
   * @returns {Object} Availability status
   */
  async checkAvailability(productId, requestedQuantity) {
    try {
      this.log('checkAvailability', { productId, requestedQuantity });

      const product = await this.getProductById(productId);

      const isAvailable = product.availability === "Available" && 
                         product.isActive && 
                         product.stock >= requestedQuantity;

      return {
        available: isAvailable,
        stock: product.stock,
        availability: product.availability,
        isActive: product.isActive
      };
    } catch (error) {
      this.handleError(error, 'checkAvailability');
    }
  }
}

module.exports = new ProductService();
