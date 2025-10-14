const mongoose = require("mongoose");
const sellerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'seller' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  verifyToken: { type: String },
  
  // Review and rating fields
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0, min: 0 }, // Points earned from ratings
  ratingBreakdown: {
    fiveStar: { type: Number, default: 0 },
    fourStar: { type: Number, default: 0 },
    threeStar: { type: Number, default: 0 },
    twoStar: { type: Number, default: 0 },
    oneStar: { type: Number, default: 0 }
  }
});
module.exports = mongoose.model("Seller", sellerSchema);