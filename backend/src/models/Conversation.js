const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Buyer",
    required: true 
  },
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Seller",
    required: true 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",
    required: true 
  }, // product they are talking about
  lastMessage: {
    type: String,
    default: ""
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient querying
conversationSchema.index({ buyerId: 1, sellerId: 1, product: 1 });
conversationSchema.index({ buyerId: 1, lastMessageAt: -1 });
conversationSchema.index({ sellerId: 1, lastMessageAt: -1 });
conversationSchema.index({ buyerId: 1, lastMessageTime: -1 });
conversationSchema.index({ sellerId: 1, lastMessageTime: -1 });
conversationSchema.index({ isActive: 1 });

// Unique compound index to prevent duplicate conversations
conversationSchema.index(
  { buyerId: 1, sellerId: 1, product: 1, isActive: 1 }, 
  { unique: true, partialFilterExpression: { isActive: { $ne: false } } }
);

module.exports = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
