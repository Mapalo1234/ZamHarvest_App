const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Conversation", 
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: "senderModel",
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: "receiverModel",
    required: true 
  },
  senderType: {
    type: String,
    enum: ["buyer", "seller"],
    required: true
  },
  receiverType: {
    type: String,
    enum: ["buyer", "seller"],
    required: true
  },
  senderModel: {
    type: String,
    enum: ["Buyer", "Seller"],
    required: true
  },
  receiverModel: {
    type: String,
    enum: ["Buyer", "Seller"],
    required: true
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, isRead: 1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
