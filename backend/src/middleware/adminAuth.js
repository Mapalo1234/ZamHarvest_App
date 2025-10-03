const Admin = require("../models/admin");

/**
 * Middleware to check if user is authenticated admin
 */
const requireAdminAuth = async (req, res, next) => {
  try {
    // Check if admin session exists
    if (!req.session.adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    // Find admin in database
    const admin = await Admin.findById(req.session.adminId).select('-password');
    
    if (!admin) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is deactivated"
      });
    }

    // Add admin info to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

/**
 * Middleware to check admin permissions
 */
const requireAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has specific permission
    if (!req.admin.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }

    next();
  };
};

/**
 * Middleware to check admin role level
 */
const requireAdminRole = (minRole) => {
  const roleLevels = {
    'moderator': 1,
    'admin': 2,
    'super_admin': 3
  };

  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    const adminLevel = roleLevels[req.admin.role] || 0;
    const requiredLevel = roleLevels[minRole] || 0;

    if (adminLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: "Insufficient role level"
      });
    }

    next();
  };
};

module.exports = {
  requireAdminAuth,
  requireAdminPermission,
  requireAdminRole
};
