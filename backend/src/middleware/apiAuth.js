/**
 * API Authentication Middleware
 * Handles authentication for API routes
 */
const apiAuth = (req, res, next) => {
  // Check if user session exists
  if (!req.session.userId || !req.session.role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }
  
  // Allow both buyers and sellers
  if (req.session.role !== 'buyer' && req.session.role !== 'seller') {
    return res.status(403).json({
      success: false,
      message: "Invalid user role. Please log in as a buyer or seller."
    });
  }
  
  next();
};

/**
 * API Authentication Middleware for Buyers Only
 */
const apiAuthBuyer = (req, res, next) => {
  // Check if user session exists
  if (!req.session.userId || !req.session.role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }
  
  // Only allow buyers
  if (req.session.role !== 'buyer') {
    return res.status(403).json({
      success: false,
      message: "Buyer access required"
    });
  }
  
  next();
};

/**
 * API Authentication Middleware for Sellers Only
 */
const apiAuthSeller = (req, res, next) => {
  // Check if user session exists
  if (!req.session.userId || !req.session.role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }
  
  // Only allow sellers
  if (req.session.role !== 'seller') {
    return res.status(403).json({
      success: false,
      message: "Seller access required"
    });
  }
  
  next();
};

module.exports = {
  apiAuth,
  apiAuthBuyer,
  apiAuthSeller
};
