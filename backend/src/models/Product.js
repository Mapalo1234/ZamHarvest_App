const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  province: { type: String, required: true },
  location: { type: String, required: true },
  organicStatus: { type: String, enum: ["Organic", "Non-Organic", "Certified Organic"], default: "Non-Organic" },
  image: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
  sellername: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: "kg" },
  harvestDate: { type: Date },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
});



module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
