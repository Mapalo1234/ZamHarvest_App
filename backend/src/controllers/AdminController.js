const Admin = require("../models/admin");
const BaseController = require("./BaseController");

class AdminController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Admin login with form submission (redirects on success)
   */
  loginWithRedirect = this.asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.render('admin/login', { error: "Username and password are required" });
    }

    try {
      // Find admin by username or email
      const admin = await Admin.findOne({
        $or: [{ username }, { email: username }],
        isActive: true
      });

      if (!admin) {
        return res.render('admin/login', { error: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.render('admin/login', { error: "Invalid credentials" });
      }

      // Set session data
      req.session.adminId = admin._id;
      req.session.adminRole = admin.role;
      req.session.adminPermissions = admin.permissions;

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      this.log('Admin login successful', { adminId: admin._id, role: admin.role });
      
      // Redirect to dashboard
      return res.redirect('/admin/dashboard');
    } catch (error) {
      this.handleError(error, 'Admin login');
      return res.render('admin/login', { error: "An error occurred during login" });
    }
  });

  /**
   * Admin login (API endpoint)
   */
  login = this.asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return this.sendError(res, "Username and password are required", 400);
    }

    try {
      // Find admin by username or email
      const admin = await Admin.findOne({
        $or: [{ username }, { email: username }],
        isActive: true
      });

      if (!admin) {
        return this.sendError(res, "Invalid credentials", 401);
      }

      // Check password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return this.sendError(res, "Invalid credentials", 401);
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Create session
      req.session.adminId = admin._id;
      req.session.adminRole = admin.role;
      req.session.isAdmin = true;

      // Remove password from response
      const adminData = admin.toObject();
      delete adminData.password;

      this.log('Admin login successful', { adminId: admin._id, role: admin.role });
      
      return this.sendSuccess(res, {
        message: "Login successful",
        admin: adminData
      }, 200);

    } catch (error) {
      this.handleError(error, 'Admin login');
    }
  });

  /**
   * Admin logout
   */
  logout = this.asyncHandler(async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return this.sendError(res, "Logout failed", 500);
        }
        
        res.clearCookie('connect.sid');
        return this.sendSuccess(res, { message: "Logout successful" }, 200);
      });
    } catch (error) {
      this.handleError(error, 'Admin logout');
    }
  });

  /**
   * Get current admin profile
   */
  getProfile = this.asyncHandler(async (req, res) => {
    try {
      const admin = await Admin.findById(req.session.adminId).select('-password');
      
      if (!admin) {
        return this.sendError(res, "Admin not found", 404);
      }

      return this.sendSuccess(res, { admin }, 200);
    } catch (error) {
      this.handleError(error, 'Get admin profile');
    }
  });

  /**
   * Update admin profile
   */
  updateProfile = this.asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, avatar } = req.body;
    const adminId = req.session.adminId;

    try {
      const updateData = {};
      if (firstName) updateData['profile.firstName'] = firstName;
      if (lastName) updateData['profile.lastName'] = lastName;
      if (phone) updateData['profile.phone'] = phone;
      if (avatar) updateData['profile.avatar'] = avatar;

      const admin = await Admin.findByIdAndUpdate(
        adminId,
        { $set: updateData },
        { new: true, select: '-password' }
      );

      if (!admin) {
        return this.sendError(res, "Admin not found", 404);
      }

      return this.sendSuccess(res, { 
        message: "Profile updated successfully",
        admin 
      }, 200);

    } catch (error) {
      this.handleError(error, 'Update admin profile');
    }
  });

  /**
   * Change admin password
   */
  changePassword = this.asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.session.adminId;

    if (!currentPassword || !newPassword) {
      return this.sendError(res, "Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return this.sendError(res, "New password must be at least 6 characters", 400);
    }

    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return this.sendError(res, "Admin not found", 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return this.sendError(res, "Current password is incorrect", 400);
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      return this.sendSuccess(res, { message: "Password changed successfully" }, 200);

    } catch (error) {
      this.handleError(error, 'Change admin password');
    }
  });

  /**
   * Get admin dashboard statistics
   */
  getDashboardStats = this.asyncHandler(async (req, res) => {
    try {
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

      return this.sendSuccess(res, { stats }, 200);

    } catch (error) {
      this.handleError(error, 'Get dashboard stats');
    }
  });

  /**
   * Get dashboard charts data
   */
  getDashboardCharts = this.asyncHandler(async (req, res) => {
    try {
      const Order = require("../models/order");
      const Buyer = require("../models/buyer");
      const Seller = require("../models/seller");

      // Get revenue data for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyRevenue = await Order.aggregate([
        {
          $match: {
            paidStatus: 'Paid',
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalRevenue: { $sum: '$totalPrice' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Get user growth data for last 6 months
      const monthlyUserGrowth = await Promise.all([
        Buyer.aggregate([
          {
            $match: {
              createdAt: { $gte: sixMonthsAgo }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 }
          }
        ]),
        Seller.aggregate([
          {
            $match: {
              createdAt: { $gte: sixMonthsAgo }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 }
          }
        ])
      ]);

      // Format data for charts
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      
      // Generate last 6 months labels
      const labels = [];
      const revenueData = [];
      const userGrowthData = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        labels.push(monthNames[date.getMonth()]);
        
        // Find revenue data for this month
        const revenueMonth = monthlyRevenue.find(r => 
          r._id.year === date.getFullYear() && r._id.month === date.getMonth() + 1
        );
        revenueData.push(revenueMonth ? revenueMonth.totalRevenue : 0);
        
        // Find user growth data for this month
        const buyerMonth = monthlyUserGrowth[0].find(u => 
          u._id.year === date.getFullYear() && u._id.month === date.getMonth() + 1
        );
        const sellerMonth = monthlyUserGrowth[1].find(u => 
          u._id.year === date.getFullYear() && u._id.month === date.getMonth() + 1
        );
        userGrowthData.push((buyerMonth ? buyerMonth.count : 0) + (sellerMonth ? sellerMonth.count : 0));
      }

      const chartsData = {
        revenue: {
          labels,
          data: revenueData
        },
        userGrowth: {
          labels,
          data: userGrowthData
        }
      };

      return this.sendSuccess(res, { charts: chartsData }, 200);

    } catch (error) {
      this.handleError(error, 'Get dashboard charts');
    }
  });

  /**
   * Check admin authentication status
   */
  checkAuth = this.asyncHandler(async (req, res) => {
    try {
      if (!req.session.adminId) {
        return this.sendError(res, "Not authenticated", 401);
      }

      const admin = await Admin.findById(req.session.adminId).select('-password');
      if (!admin || !admin.isActive) {
        return this.sendError(res, "Invalid session", 401);
      }

      return this.sendSuccess(res, { 
        authenticated: true,
        admin 
      }, 200);

    } catch (error) {
      this.handleError(error, 'Check admin auth');
    }
  });
}

module.exports = new AdminController();
