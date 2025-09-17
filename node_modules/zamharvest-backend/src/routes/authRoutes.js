const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Buyer = require("../models/buyer");
const Seller = require("../models/seller");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// Middleware to ensure user is a buyer
function ensureBuyer(req, res, next) {
  if (req.session.userId && req.session.role === "buyer") {
    return next();
  }
  return res.status(403).render("error", { message: "You must be logged in as a buyer to view this page." });
}

// Middleware to ensure user is a seller
function ensureSeller(req, res, next) {
  if (!req.session.userId || req.session.role !== 'seller') {
    return res.status(403).render('error', { message: "Please log in as seller to access this page." });
  }
  next();
}

// Signup route
router.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const Model = role === "buyer" ? Buyer : role === "seller" ? Seller : null;
  if (!Model) return res.status(400).send("Invalid role");

  const exists = await Model.findOne({ email });
  if (exists) return res.status(400).send("Email already exists");

  const hashed = await bcrypt.hash(password, 10);

  await Model.create({
    username,
    email,
    password: hashed,
    role,
    verifyToken,
    isVerified: false
  });

  await sendEmail(email, verifyToken);
  res.send("Check your email to verify your account.");
});

// Email verification route
router.get("/verify", async (req, res) => {
  const token = req.query.token;

  const user = await Buyer.findOne({ verifyToken: token }) ||
               await Seller.findOne({ verifyToken: token });

  if (!user) return res.send("Invalid or expired token");

  user.isVerified = true;
  user.verifyToken = undefined;
  await user.save();

  res.redirect("/verified");
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await Buyer.findOne({ username }) || await Seller.findOne({ username });

  if (!user) return res.send("Invalid username or password");
  if (!await bcrypt.compare(password, user.password)) return res.send("Invalid username or password");
  if (!user.isVerified) return res.send("Please verify your email first.");

  req.session.userId = user._id;
  req.session.role = user.role;
  req.session.username = user.username;

  // Pass user data to template
  res.render("home", { layout: false, user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = { router, ensureBuyer, ensureSeller };
