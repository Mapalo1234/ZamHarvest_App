const mongoose = require("mongoose");
const buyerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'buyer' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  verifyToken: { type: String }
});
module.exports = mongoose.model("Buyer", buyerSchema);