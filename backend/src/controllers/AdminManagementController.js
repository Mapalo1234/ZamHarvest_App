const Buyer = require("../models/buyer");
const Seller = require("../models/seller");
const Product = require("../models/Product");
const Order = require("../models/order");
const BaseController = require("./BaseController");

class AdminManagementController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Get all users (buyers and sellers)
   */
  getAllUsers = this.asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit = 10, role, status, search } = req.query;
      const skip = (page - 1) * limit;

      let buyerQuery = {};
      let sellerQuery = {};

      // Apply filters
      if (status === 'active') {
        buyerQuery.isActive = true;
        sellerQuery.isActive = true;
      } else if (status === 'inactive') {
        buyerQuery.isActive = false;
        sellerQuery.isActive = false;
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        buyerQuery.$or = [
          { username: searchRegex },
          { email: searchRegex }
        ];
        sellerQuery.$or = [
          { username: searchRegex },
          { email: searchRegex }
        ];
      }

      let buyers = [];
      let sellers = [];

      if (!role || role === 'buyer') {
        buyers = await Buyer.find(buyerQuery)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
      }

      if (!role || role === 'seller') {
        sellers = await Seller.find(sellerQuery)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
      }

      // Get counts
      const buyerCount = await Buyer.countDocuments(buyerQuery);
      const sellerCount = await Seller.countDocuments(sellerQuery);
      const activeBuyerCount = await Buyer.countDocuments({ ...buyerQuery, isActive: true });
      const activeSellerCount = await Seller.countDocuments({ ...sellerQuery, isActive: true });
      const pendingBuyerCount = await Buyer.countDocuments({ ...buyerQuery, isVerified: false });
      const pendingSellerCount = await Seller.countDocuments({ ...sellerQuery, isVerified: false });

      const users = [
        ...buyers.map(user => ({ ...user, role: 'buyer' })),
        ...sellers.map(user => ({ ...user, role: 'seller' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return this.sendSuccess(res, {
        users: {
          list: users,
          total: buyerCount + sellerCount,
          buyers: buyerCount,
          sellers: sellerCount,
          active: activeBuyerCount + activeSellerCount,
          pending: pendingBuyerCount + pendingSellerCount,
          suspended: (buyerCount + sellerCount) - (activeBuyerCount + activeSellerCount)
        }
      }, 200);

    } catch (error) {
      this.handleError(error, 'Get all users');
    }
  });

  /**
   * Get all products
   */
  getAllProducts = this.asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit = 10, category, status, search } = req.query;
      const skip = (page - 1) * limit;

      let query = {};

      // Apply filters
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { sellername: searchRegex }
        ];
      }

      const products = await Product.find(query)
        .populate('sellerId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get counts
      const totalProducts = await Product.countDocuments(query);
      const activeProducts = await Product.countDocuments({ ...query, isActive: true });
      const pendingProducts = await Product.countDocuments({ ...query, isActive: false });
      const outOfStockProducts = await Product.countDocuments({ ...query, availability: 'Unavailable' });

      return this.sendSuccess(res, {
        products: {
          list: products,
          total: totalProducts,
          active: activeProducts,
          pending: pendingProducts,
          outOfStock: outOfStockProducts
        }
      }, 200);

    } catch (error) {
      this.handleError(error, 'Get all products');
    }
  });

  /**
   * Get all orders
   */
  getAllOrders = this.asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const skip = (page - 1) * limit;

      let query = {};

      // Apply filters
      if (status) {
        query.paidStatus = status;
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { orderId: searchRegex },
          { productName: searchRegex },
          { sellerName: searchRegex }
        ];
      }

      const orders = await Order.find(query)
        .populate('buyerId', 'username email')
        .populate('sellerId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get counts and revenue
      const totalOrders = await Order.countDocuments(query);
      const completedOrders = await Order.countDocuments({ ...query, paidStatus: 'Paid' });
      const pendingOrders = await Order.countDocuments({ ...query, paidStatus: 'Pending' });
      
      const revenueResult = await Order.aggregate([
        { $match: { ...query, paidStatus: 'Paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
      ]);

      const revenue = revenueResult[0]?.totalRevenue || 0;

      return this.sendSuccess(res, {
        orders: {
          list: orders,
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
          revenue: revenue
        }
      }, 200);

    } catch (error) {
      this.handleError(error, 'Get all orders');
    }
  });

  /**
   * Toggle user status (activate/deactivate)
   */
  toggleUserStatus = this.asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    try {
      console.log(`Toggling user status for userId: ${userId}, role: ${role}`);
      
      const Model = role === 'buyer' ? Buyer : Seller;
      const user = await Model.findById(userId);

      if (!user) {
        console.log(`User not found: ${userId}`);
        return this.sendError(res, "User not found", 404);
      }

      console.log(`Current user status: ${user.isActive}`);
      
      // Ensure isActive field exists (for existing users)
      if (user.isActive === undefined) {
        user.isActive = true; // Default to active for existing users
      }
      
      user.isActive = !user.isActive;
      await user.save();

      console.log(`Updated user status to: ${user.isActive}`);

      return this.sendSuccess(res, {
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        user: { ...user.toObject(), role }
      }, 200);

    } catch (error) {
      console.error('Error in toggleUserStatus:', error);
      this.handleError(error, 'Toggle user status');
    }
  });

  /**
   * Toggle product status (activate/deactivate)
   */
  toggleProductStatus = this.asyncHandler(async (req, res) => {
    const { productId } = req.params;

    try {
      const product = await Product.findById(productId);

      if (!product) {
        return this.sendError(res, "Product not found", 404);
      }

      product.isActive = !product.isActive;
      await product.save();

      return this.sendSuccess(res, {
        message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
        product
      }, 200);

    } catch (error) {
      this.handleError(error, 'Toggle product status');
    }
  });

  /**
   * Update order status
   */
  updateOrderStatus = this.asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
      // Validate and trim the status
      const validStatuses = ["Pending", "Paid", "Rejected"];
      const trimmedStatus = status ? status.trim() : '';
      
      if (!validStatuses.includes(trimmedStatus)) {
        return this.sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return this.sendError(res, "Order not found", 404);
      }

      order.paidStatus = trimmedStatus;
      await order.save();

      return this.sendSuccess(res, {
        message: "Order status updated successfully",
        order
      }, 200);

    } catch (error) {
      this.handleError(error, 'Update order status');
    }
  });

  /**
   * Get analytics data
   */
  getAnalytics = this.asyncHandler(async (req, res) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // User analytics
      const userStats = await Promise.all([
        Buyer.countDocuments({ createdAt: { $gte: startDate } }),
        Seller.countDocuments({ createdAt: { $gte: startDate } }),
        Buyer.countDocuments(),
        Seller.countDocuments()
      ]);

      // Product analytics
      const productStats = await Promise.all([
        Product.countDocuments({ createdAt: { $gte: startDate } }),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments()
      ]);

      // Order analytics
      const orderStats = await Order.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            avgOrderValue: { $avg: '$totalPrice' }
          }
        }
      ]);

      // Revenue by day
      const revenueByDay = await Order.aggregate([
        {
          $match: { 
            createdAt: { $gte: startDate },
            paidStatus: 'Paid'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const analytics = {
        users: {
          newBuyers: userStats[0],
          newSellers: userStats[1],
          totalBuyers: userStats[2],
          totalSellers: userStats[3],
          total: userStats[2] + userStats[3]
        },
        products: {
          newProducts: productStats[0],
          activeProducts: productStats[1],
          totalProducts: productStats[2]
        },
        orders: {
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalRevenue: orderStats[0]?.totalRevenue || 0,
          avgOrderValue: orderStats[0]?.avgOrderValue || 0
        },
        revenueByDay
      };

      return this.sendSuccess(res, { analytics }, 200);

    } catch (error) {
      this.handleError(error, 'Get analytics');
    }
  });

  /**
   * Get system settings
   */
  getSettings = this.asyncHandler(async (req, res) => {
    try {
      // This would typically come from a settings collection
      const settings = {
        siteName: "ZamHarvest",
        siteDescription: "Agricultural Marketplace",
        commissionRate: 5.0,
        maxFileSize: 10485760, // 10MB
        allowedImageTypes: ["jpg", "jpeg", "png", "gif"],
        emailNotifications: true,
        maintenanceMode: false,
        registrationEnabled: true,
        productApprovalRequired: true
      };

      return this.sendSuccess(res, { settings }, 200);

    } catch (error) {
      this.handleError(error, 'Get settings');
    }
  });

  /**
   * Update system settings
   */
  updateSettings = this.asyncHandler(async (req, res) => {
    try {
      const settings = req.body;
      
      // This would typically save to a settings collection
      // For now, just return success
      
      return this.sendSuccess(res, {
        message: "Settings updated successfully",
        settings
      }, 200);

    } catch (error) {
      this.handleError(error, 'Update settings');
    }
  });
}

module.exports = new AdminManagementController();
