const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  promoPrice: { type: Number, min: 0 },
  isOnPromotion: { type: Boolean, default: false },
  promotionEndDate: { type: Date },
  category: { type: String, required: true },
  province: { type: String, required: true },
  location: { type: String, required: true },
  organicStatus: { type: String, enum: ["Organic", "Non-Organic", "Certified Organic"], default: "Non-Organic" },
  image: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
  sellername: { type: String, required: true },
  unit: { type: String, default: "kg" },
  stock: { type: Number, min: 0, default: 0 },
  availability: { 
    type: String, 
    enum: ["Available", "Unavailable"], 
    default: "Available"
  },
  isActive: { type: Boolean, default: true },
  isDummyProduct: { type: Boolean, default: false }, // Flag to mark dummy messaging products
  createdAt: {
    type: Date,
    default: Date.now
  }
});



module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
