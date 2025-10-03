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
  unit: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  requestStatus: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  paidStatus: { type: String, enum: ["Pending", "Paid", "Rejected"], default: "Pending" },
  deliveryStatus: { type: String, enum: ["Pending", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
  deliveredAt: { type: Date },
  canReview: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" } // Link to request
});

module.exports = mongoose.model("Order", orderSchema);
 