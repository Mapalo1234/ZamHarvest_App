const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'moderator'], 
    default: 'admin' 
  },
  permissions: [{
    type: String,
    enum: [
      'user_management',
      'product_management', 
      'order_management',
      'analytics_view',
      'settings_management',
      'content_moderation',
      'financial_reports',
      'system_configuration'
    ]
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt on save
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
adminSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

// Index for performance (removed duplicate indexes)
adminSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model("Admin", adminSchema);
