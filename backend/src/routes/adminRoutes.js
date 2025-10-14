const express = require("express");
const AdminController = require("../controllers/AdminController");
const AdminManagementController = require("../controllers/AdminManagementController");
const { requireAdminAuth, requireAdminPermission } = require("../middleware/adminAuth");

const router = express.Router();

// Public routes (no authentication required)
router.get("/login", (req, res) => res.render("admin/login")); // Login page
router.post("/login", AdminController.loginWithRedirect); // Form submission
router.post("/api/login", AdminController.login); // API endpoint
router.get("/check-auth", AdminController.checkAuth);

// Protected routes (require admin authentication)
router.use(requireAdminAuth);

// Admin dashboard page
router.get("/dashboard", async (req, res) => {
  try {
    // Get real dashboard stats
    const Buyer = require("../models/buyer");
    const Seller = require("../models/seller");
    const Product = require("../models/Product");
    const Order = require("../models/order");

    // Get user counts
    const [buyerCount, sellerCount, productCount, orderCount] = await Promise.all([
      Buyer.countDocuments({ isVerified: true }),
      Seller.countDocuments({ isVerified: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments()
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('buyerId', 'username email')
      .populate('sellerId', 'username email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId buyerId sellerId totalPrice paidStatus deliveryStatus createdAt')
      .lean(); // Convert to plain JavaScript objects

    // Get revenue data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await Order.aggregate([
      {
        $match: {
          paidStatus: 'Paid',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      users: {
        total: buyerCount + sellerCount,
        buyers: buyerCount,
        sellers: sellerCount
      },
      products: {
        total: productCount,
        active: productCount
      },
      orders: {
        total: orderCount
      },
      revenue: {
        total: revenueData[0]?.totalRevenue || 0,
        orders: revenueData[0]?.orderCount || 0
      },
      recentOrders
    };

    res.render("admin/dashboard", { 
      admin: req.admin,
      stats: stats
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // Fallback to empty stats if there's an error
    res.render("admin/dashboard", { 
      admin: req.admin,
      stats: {
        users: { total: 0, buyers: 0, sellers: 0 },
        products: { total: 0, active: 0 },
        orders: { total: 0 },
        revenue: { total: 0, orders: 0 },
        recentOrders: []
      }
    });
  }
});

// Authentication routes
router.post("/logout", AdminController.logout);
router.get("/profile", AdminController.getProfile);
router.put("/profile", AdminController.updateProfile);
router.put("/change-password", AdminController.changePassword);

// Dashboard routes
router.get("/dashboard/stats", AdminController.getDashboardStats);
router.get("/dashboard/charts", AdminController.getDashboardCharts);

// User management routes
router.get("/users", requireAdminPermission('user_management'), AdminManagementController.getAllUsers);
router.put("/users/:userId/status", requireAdminPermission('user_management'), AdminManagementController.toggleUserStatus);

// Product management routes
router.get("/products", requireAdminPermission('product_management'), AdminManagementController.getAllProducts);
router.put("/products/:productId/status", requireAdminPermission('product_management'), AdminManagementController.toggleProductStatus);

// Order management routes
router.get("/orders", requireAdminPermission('order_management'), AdminManagementController.getAllOrders);
router.put("/orders/:orderId/status", requireAdminPermission('order_management'), AdminManagementController.updateOrderStatus);

// Analytics routes
router.get("/analytics", requireAdminPermission('analytics_view'), AdminManagementController.getAnalytics);

// Settings routes
router.get("/settings", requireAdminPermission('settings_management'), AdminManagementController.getSettings);
router.put("/settings", requireAdminPermission('settings_management'), AdminManagementController.updateSettings);

module.exports = router;
