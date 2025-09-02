const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },
  username: { type: String, required: false },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  image: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  sellerName: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  paidStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true }
});

module.exports = mongoose.model("Order", orderSchema);
 