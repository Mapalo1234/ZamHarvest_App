const mongoose = require("mongoose");
const sellerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'seller' },
  isVerified: { type: Boolean, default: false },
  verifyToken: { type: String }
});
module.exports = mongoose.model("Seller", sellerSchema);