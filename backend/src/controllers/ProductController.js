const ProductService = require("../services/ProductService");
const BaseController = require("./BaseController");

/**
 * Product Controller
 * Handles HTTP requests for product operations
 */
class ProductController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Get products based on user role
   */
  getProducts = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      ProductService.getProducts(userId, role),
      'Products retrieved successfully'
    );
  });

  /**
   * Get all products (test/admin endpoint)
   */
  getAllProducts = this.asyncHandler(async (req, res) => {
    await this.handleServiceResponse(
      res,
      ProductService.getAllProducts(),
      'All products retrieved successfully'
    );
  });

  /**
   * Create a new product (sellers only)
   */
  createProduct = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'seller') {
      return this.sendError(res, 'Please log in as a seller', 403);
    }

    await this.handleServiceResponse(
      res,
      ProductService.createProduct(req.body, userId),
      'Product created successfully',
      201
    );
  });

  /**
   * Get product by ID
   */
  getProductById = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await this.handleServiceResponse(
      res,
      ProductService.getProductById(id),
      'Product retrieved successfully'
    );
  });

  /**
   * Update product (sellers only)
   */
  updateProduct = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { id } = req.params;
    
    if (!userId || role !== 'seller') {
      return this.sendError(res, 'Please log in as a seller', 403);
    }

    await this.handleServiceResponse(
      res,
      ProductService.updateProduct(id, req.body, userId),
      'Product updated successfully'
    );
  });

  /**
   * Delete product (sellers only)
   */
  deleteProduct = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { id } = req.params;
    
    if (!userId || role !== 'seller') {
      return this.sendError(res, 'Please log in as a seller', 403);
    }

    await this.handleServiceResponse(
      res,
      ProductService.deleteProduct(id, userId),
      'Product deleted successfully'
    );
  });

  /**
   * Search products
   */
  searchProducts = this.asyncHandler(async (req, res) => {
    const searchCriteria = {
      query: req.query.q,
      category: req.query.category,
      province: req.query.province,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      organicStatus: req.query.organicStatus
    };

    await this.handleServiceResponse(
      res,
      ProductService.searchProducts(searchCriteria),
      'Products search completed'
    );
  });

  /**
   * Check product availability
   */
  checkAvailability = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.query;
    
    const requestedQuantity = quantity ? parseInt(quantity) : 1;

    await this.handleServiceResponse(
      res,
      ProductService.checkAvailability(id, requestedQuantity),
      'Availability checked successfully'
    );
  });

  /**
   * Get product categories (for filters)
   */
  getCategories = this.asyncHandler(async (req, res) => {
    // This could be moved to a separate service if categories become dynamic
    const categories = [
      'Fruits',
      'Vegetables',
      'Grains',
      'Legumes',
      'Herbs & Spices',
      'Dairy',
      'Meat & Poultry',
      'Fish & Seafood',
      'Nuts & Seeds',
      'Other'
    ];

    return this.sendSuccess(res, categories, 'Categories retrieved successfully');
  });

  /**
   * Get provinces (for filters)
   */
  getProvinces = this.asyncHandler(async (req, res) => {
    // This could be moved to a separate service if provinces become dynamic
    const provinces = [
      'Central',
      'Copperbelt',
      'Eastern',
      'Luapula',
      'Lusaka',
      'Muchinga',
      'Northern',
      'North-Western',
      'Southern',
      'Western'
    ];

    return this.sendSuccess(res, provinces, 'Provinces retrieved successfully');
  });
}

module.exports = new ProductController();
