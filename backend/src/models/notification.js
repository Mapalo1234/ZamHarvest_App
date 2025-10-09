const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Buyer', 'Seller']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'order_created', 'order_updated', 'order_cancelled', 
      'request_received', 'request_accepted', 'request_rejected', 'request_updated', 
      'payment_received', 'payment_confirmed', 'payment_success', 'payment_failed', 
      'delivery_scheduled', 'delivery_confirmed', 'delivery_completed',
      'seller_rated', 'review_submitted', 'product_available', 
      'message_received', 'message_sent', 
      'receipt_available', 'receipt_emailed', 
      'welcome', 'user_registered', 'product_added', 'product_updated',
      'order_delivered', 'order_completed', 'order_cancelled_by_seller',
      'low_stock', 'product_out_of_stock', 'price_updated'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    orderId: { type: String },
    productId: { type: mongoose.Schema.Types.ObjectId },
    requestId: { type: mongoose.Schema.Types.ObjectId },
    messageId: { type: mongoose.Schema.Types.ObjectId },
    senderId: { type: mongoose.Schema.Types.ObjectId },
    receiverId: { type: mongoose.Schema.Types.ObjectId },
    amount: { type: Number },
    deliveryDate: { type: Date }
  },
  isRead: { type: Boolean, default: false },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
