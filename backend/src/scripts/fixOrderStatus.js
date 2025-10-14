const mongoose = require('mongoose');
const Order = require('../models/order');
require('dotenv').config();

async function fixOrderStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ZamHarvestDB');
    console.log('Connected to MongoDB');

    // Find orders with invalid status values (with trailing spaces)
    const invalidOrders = await Order.find({
      $or: [
        { paidStatus: /^\s+|\s+$/ }, // Has leading or trailing spaces
        { deliveryStatus: /^\s+|\s+$/ }
      ]
    });

    console.log(`Found ${invalidOrders.length} orders with invalid status values`);

    // Fix each order
    for (const order of invalidOrders) {
      console.log(`Fixing order ${order.orderId}:`);
      console.log(`  Before - paidStatus: "${order.paidStatus}", deliveryStatus: "${order.deliveryStatus}"`);
      
      // Trim and validate status values
      if (order.paidStatus) {
        order.paidStatus = order.paidStatus.trim();
        // Ensure it's a valid enum value
        const validPaidStatuses = ["Pending", "Paid", "Rejected"];
        if (!validPaidStatuses.includes(order.paidStatus)) {
          console.log(`  Invalid paidStatus "${order.paidStatus}", setting to "Pending"`);
          order.paidStatus = "Pending";
        }
      }
      
      if (order.deliveryStatus) {
        order.deliveryStatus = order.deliveryStatus.trim();
        // Ensure it's a valid enum value
        const validDeliveryStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
        if (!validDeliveryStatuses.includes(order.deliveryStatus)) {
          console.log(`  Invalid deliveryStatus "${order.deliveryStatus}", setting to "Pending"`);
          order.deliveryStatus = "Pending";
        }
      }
      
      console.log(`  After - paidStatus: "${order.paidStatus}", deliveryStatus: "${order.deliveryStatus}"`);
      
      await order.save();
    }

    console.log('✅ Order status cleanup completed successfully!');
    
    // Show final counts
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ paidStatus: 'Pending' });
    const paidOrders = await Order.countDocuments({ paidStatus: 'Paid' });
    const rejectedOrders = await Order.countDocuments({ paidStatus: 'Rejected' });
    
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Pending: ${pendingOrders}, Paid: ${paidOrders}, Rejected: ${rejectedOrders}`);

  } catch (error) {
    console.error('Error during order status cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

fixOrderStatus();
