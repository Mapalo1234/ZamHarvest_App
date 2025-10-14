const Product = require("../models/Product");
const BaseRepository = require("./BaseRepository");

/**
 * Product Repository
 * Handles product-specific database operations
 */
class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  /**
   * Find products by seller ID
   * @param {string} sellerId - Seller ID
   * @param {Object} options - Query options
   * @returns {Array} Array of products
   */
  async findBySellerId(sellerId, options = {}) {
    const filter = { 
      sellerId, 
      isDummyProduct: { $ne: true },
      ...options.additionalFilter 
    };
    
    return await this.findAll(filter, {
      populate: "sellerId",
      sort: { createdAt: -1 },
      ...options
    });
  }

  /**
   * Find active products for buyers
   * @param {Object} options - Query options
   * @returns {Array} Array of products
   */
  async findActiveProducts(options = {}) {
    const filter = {
      isDummyProduct: { $ne: true },
      isActive: true,
      availability: "Available",
      ...options.additionalFilter
    };

    return await this.findAll(filter, {
      populate: "sellerId",
      sort: { createdAt: -1 },
      ...options
    });
  }

  /**
   * Search products with filters
   * @param {Object} searchCriteria - Search criteria
   * @returns {Array} Array of matching products
   */
  async searchProducts(searchCriteria) {
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

    return await this.findAll(filter, {
      populate: "sellerId",
      sort: { createdAt: -1 }
    });
  }

  /**
   * Update product stock
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to subtract
   * @returns {Object} Updated product
   */
  async updateStock(productId, quantity) {
    return await this.updateById(productId, {
      $inc: { stock: -quantity }
    });
  }

  /**
   * Get products by category
   * @param {string} category - Product category
   * @param {Object} options - Query options
   * @returns {Array} Array of products
   */
  async findByCategory(category, options = {}) {
    const filter = {
      category,
      isDummyProduct: { $ne: true },
      isActive: true
    };

    return await this.findAll(filter, {
      populate: "sellerId",
      sort: { createdAt: -1 },
      ...options
    });
  }

  /**
   * Get products by province
   * @param {string} province - Product province
   * @param {Object} options - Query options
   * @returns {Array} Array of products
   */
  async findByProvince(province, options = {}) {
    const filter = {
      province,
      isDummyProduct: { $ne: true },
      isActive: true
    };

    return await this.findAll(filter, {
      populate: "sellerId",
      sort: { createdAt: -1 },
      ...options
    });
  }

  /**
   * Get low stock products
   * @param {number} threshold - Stock threshold
   * @returns {Array} Array of low stock products
   */
  async findLowStockProducts(threshold = 10) {
    const filter = {
      stock: { $lte: threshold },
      isDummyProduct: { $ne: true },
      isActive: true
    };

    return await this.findAll(filter, {
      populate: "sellerId",
      sort: { stock: 1 }
    });
  }
}

module.exports = new ProductRepository();
