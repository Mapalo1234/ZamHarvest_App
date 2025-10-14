const mongoose = require('mongoose');
const Buyer = require('../models/buyer');
const Seller = require('../models/seller');
require('dotenv').config();

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ZamHarvestDB');
    console.log('Connected to MongoDB');

    // Create test buyers
    const testBuyers = [
      {
        username: 'buyer1',
        email: 'buyer1@test.com',
        password: 'password123',
        isVerified: true,
        isActive: true
      },
      {
        username: 'buyer2',
        email: 'buyer2@test.com',
        password: 'password123',
        isVerified: true,
        isActive: false
      }
    ];

    // Create test sellers
    const testSellers = [
      {
        username: 'seller1',
        email: 'seller1@test.com',
        password: 'password123',
        isVerified: true,
        isActive: true
      },
      {
        username: 'seller2',
        email: 'seller2@test.com',
        password: 'password123',
        isVerified: true,
        isActive: false
      }
    ];

    // Clear existing test users
    await Buyer.deleteMany({ email: { $regex: /@test\.com$/ } });
    await Seller.deleteMany({ email: { $regex: /@test\.com$/ } });

    // Create buyers
    for (const buyerData of testBuyers) {
      const buyer = new Buyer(buyerData);
      await buyer.save();
      console.log(`Created buyer: ${buyerData.username}`);
    }

    // Create sellers
    for (const sellerData of testSellers) {
      const seller = new Seller(sellerData);
      await seller.save();
      console.log(`Created seller: ${sellerData.username}`);
    }

    console.log('✅ Test users created successfully!');
    
    // Show counts
    const buyerCount = await Buyer.countDocuments();
    const sellerCount = await Seller.countDocuments();
    const activeBuyerCount = await Buyer.countDocuments({ isActive: true });
    const activeSellerCount = await Seller.countDocuments({ isActive: true });
    
    console.log(`Total buyers: ${buyerCount}, Active: ${activeBuyerCount}`);
    console.log(`Total sellers: ${sellerCount}, Active: ${activeSellerCount}`);

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createTestUsers();
