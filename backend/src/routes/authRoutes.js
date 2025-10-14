const express = require("express");
const AuthController = require("../controllers/AuthController");

const router = express.Router();

// Middleware functions (kept for backward compatibility)
function ensureBuyer(req, res, next) {
  if (req.session.userId && req.session.role === "buyer") {
    return next();
  }
  return res.status(403).render("error", { message: "You must be logged in as a buyer to view this page." });
}

function ensureSeller(req, res, next) {
  if (!req.session.userId || req.session.role !== 'seller') {
    return res.status(403).render('error', { message: "Please log in as seller to access this page." });
  }
  next();
}

// Routes using controllers (backward compatibility with custom rendering)
router.post("/signup", AuthController.register);
router.get("/verify", AuthController.verify);
router.post("/login", AuthController.loginWithRender);
router.get("/logout", AuthController.logoutWithRedirect);

// API endpoints using controllers
router.post("/api/auth/register", AuthController.register);
router.post("/api/auth/login", AuthController.login);
router.post("/api/auth/logout", AuthController.logout);
router.get("/api/auth/profile", AuthController.getProfile);
router.get("/api/auth/check", AuthController.checkAuth);
router.get("/api/auth/verify", AuthController.verify);

module.exports = { router, ensureBuyer, ensureSeller };