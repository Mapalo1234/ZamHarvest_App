const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  // Core relationships
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
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order", 
    required: false 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },

  // Review content
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  title: { 
    type: String, 
    required: false, 
    maxlength: 100 
  },
  comment: { 
    type: String, 
    required: true, 
    maxlength: 500 
  },
  experience: {
    type: String,
    required: true,
    enum: ['poor', 'average', 'good', 'very-good', 'excellent']
  },

  // Review metadata
  isVerified: { 
    type: Boolean, 
    default: true 
  }, // Only verified buyers can review
  isVisible: { 
    type: Boolean, 
    default: true 
  }, // For moderation
  helpfulVotes: { 
    type: Number, 
    default: 0 
  }, // For review helpfulness

  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for efficient querying
reviewSchema.index({ sellerId: 1, createdAt: -1 });
reviewSchema.index({ buyerId: 1, orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $exists: true, $ne: null } } }); // One review per order (only when orderId exists)
reviewSchema.index({ buyerId: 1, productId: 1 }, { unique: true, partialFilterExpression: { orderId: { $exists: false } } }); // One review per product (only for product reviews)
reviewSchema.index({ productId: 1, rating: 1 });
reviewSchema.index({ isVisible: 1, sellerId: 1 });
reviewSchema.index({ createdAt: -1 }); // For general sorting

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for buyer name (populated)
reviewSchema.virtual('buyerName', {
  ref: 'Buyer',
  localField: 'buyerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for product name (populated)
reviewSchema.virtual('productName', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model("Review", reviewSchema);
