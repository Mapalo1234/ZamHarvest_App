module.exports = function ensureSeller(req, res, next) {
  if (!req.session.userId || req.session.role !== 'seller') {
    return res.status(403).render('error', { message: "Please log in as seller to access this page." });
  }
  next();
};