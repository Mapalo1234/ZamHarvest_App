const mongoose = require('mongoose');
const Buyer = require('../models/buyer');
const Seller = require('../models/seller');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zamharvest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateUserStatus() {
  try {
    console.log('Starting user status migration...');

    // Update all buyers that don't have isActive field
    const buyerResult = await Buyer.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    console.log(`Updated ${buyerResult.modifiedCount} buyers`);

    // Update all sellers that don't have isActive field
    const sellerResult = await Seller.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    console.log(`Updated ${sellerResult.modifiedCount} sellers`);

    console.log('User status migration completed successfully!');
    
    // Show current counts
    const buyerCount = await Buyer.countDocuments();
    const sellerCount = await Seller.countDocuments();
    const activeBuyerCount = await Buyer.countDocuments({ isActive: true });
    const activeSellerCount = await Seller.countDocuments({ isActive: true });
    
    console.log(`Total buyers: ${buyerCount}, Active: ${activeBuyerCount}`);
    console.log(`Total sellers: ${sellerCount}, Active: ${activeSellerCount}`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateUserStatus();
