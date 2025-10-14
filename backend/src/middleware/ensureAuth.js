module.exports = function ensureAuth(req, res, next) {
  if (!req.session.userId || !req.session.role) {
    return res.status(401).render('error', { message: "Please log in to access this page." });
  }
  
  // Allow both buyers and sellers
  if (req.session.role !== 'buyer' && req.session.role !== 'seller') {
    return res.status(403).render('error', { message: "Invalid user role. Please log in as a buyer or seller." });
  }
  
  next();
};
