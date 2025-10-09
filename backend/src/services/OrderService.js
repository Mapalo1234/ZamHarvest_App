const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/order");
const Request = require("../models/request");
const BaseService = require("./BaseService");

/**
 * Order Service
 * Handles order creation, management, and business logic
 */
class OrderService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @param {string} userId - Buyer ID
   * @param {string} userName - Buyer name
   * @returns {Object} Created order
   */
  async createOrder(orderData, userId, userName) {
    try {
      this.log('createOrder', { userId, productId: orderData.productId });

      const { productId, quantity, deliveryDate, totalPrice, productName, productImage, unit } = orderData;

      // Validate required fields
      this.validateRequired(orderData, ['productId', 'quantity', 'deliveryDate', 'totalPrice', 'productName']);

      // Validate productId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID");
      }

      // Validate delivery date
      if (!deliveryDate) {
        throw new Error("Delivery date is required");
      }

      const today = new Date();
      const chosenDate = new Date(deliveryDate);
      today.setHours(0, 0, 0, 0);
      chosenDate.setHours(0, 0, 0, 0);
      
      if (chosenDate < today) {
        throw new Error("Delivery date cannot be in the past");
      }

      // Fetch product to get seller details and validate availability
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.availability !== "Available") {
        throw new Error("This product is currently unavailable");
      }

      if (!product.isActive) {
        throw new Error("This product is no longer active");
      }

      // Stock check temporarily disabled - to be implemented later
      // if (product.stock < quantity) {
      //   throw new Error(`Insufficient stock. Available: ${product.stock} ${product.unit}`);
      // }

      // Get seller information
      const sellerId = product.sellerId;
      const sellerName = product.sellername || "Unknown Seller";

      // Generate unique order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create order
      const order = new Order({
        orderId,
        buyerId: userId,
        productId,
        productName,
        image: productImage,
        totalPrice,
        deliveryDate: new Date(deliveryDate),
        quantity,
        unit: unit || product.unit,
        username: userName,
        sellerId,
        sellerName,
        paidStatus: "Pending"
      });

      await order.save();

      // Create a request for the seller
      const request = new Request({
        seller: sellerId,
        buyer: userId,
        product: productId,
        order: order._id,
        status: "pending"
      });
      await request.save();

      // Link the request to the order
      order.requestId = request._id;
      await order.save();

      // Create notifications
      const NotificationService = require("./NotificationService");
      
      // Notify buyer that order was created
      await NotificationService.createNotification(
        userId,
        'buyer',
        'order_created',
        'Order Confirmed',
        `Your order for ${productName} has been confirmed and is being processed.`,
        {
          orderId: order.orderId,
          productId: productId,
          amount: totalPrice,
          deliveryDate: deliveryDate
        }
      );

      // Notify seller that they received a request
      await NotificationService.createNotification(
        sellerId,
        'seller',
        'request_received',
        'New Order Request',
        `You have received a new order request for ${productName} from ${userName}.`,
        {
          orderId: order.orderId,
          requestId: request._id,
          productId: productId,
          buyerName: userName
        }
      );

      this.log('createOrder completed', { orderId: order.orderId });
      return {
        success: true,
        message: "Order and request created successfully",
        order: order
      };
    } catch (error) {
      this.handleError(error, 'createOrder');
    }
  }

  /**
   * Get orders by buyer ID
   * @param {string} buyerId - Buyer ID
   * @returns {Array} Array of orders
   */
  async getOrdersByBuyer(buyerId) {
    try {
      this.log('getOrdersByBuyer', { buyerId });

      const orders = await Order.find({ buyerId })
        .populate('productId', 'name category image')
        .populate('sellerId', 'username')
        .sort({ createdAt: -1 });

      this.log('getOrdersByBuyer completed', { count: orders.length });
      return orders;
    } catch (error) {
      this.handleError(error, 'getOrdersByBuyer');
    }
  }

  /**
   * Get orders by seller ID
   * @param {string} sellerId - Seller ID
   * @returns {Array} Array of orders
   */
  async getOrdersBySeller(sellerId) {
    try {
      this.log('getOrdersBySeller', { sellerId });

      const orders = await Order.find({ sellerId })
        .populate('productId', 'name category image')
        .populate('buyerId', 'username')
        .sort({ createdAt: -1 });

      this.log('getOrdersBySeller completed', { count: orders.length });
      return orders;
    } catch (error) {
      this.handleError(error, 'getOrdersBySeller');
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} userRole - User role
   * @returns {Object} Order data
   */
  async getOrderById(orderId, userId, userRole) {
    try {
      this.log('getOrderById', { orderId, userId, userRole });

      const order = await Order.findById(orderId)
        .populate('productId', 'name category image')
        .populate('buyerId', 'username')
        .populate('sellerId', 'username');

      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      const isAuthorized = (userRole === 'buyer' && order.buyerId._id.toString() === userId) ||
                          (userRole === 'seller' && order.sellerId._id.toString() === userId);

      if (!isAuthorized) {
        throw new Error("Unauthorized access to this order");
      }

      this.log('getOrderById completed', { orderId: order.orderId });
      return order;
    } catch (error) {
      this.handleError(error, 'getOrderById');
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID (for authorization)
   * @param {string} userRole - User role
   * @returns {Object} Updated order
   */
  async updateOrderStatus(orderId, updateData, userId, userRole) {
    try {
      this.log('updateOrderStatus', { orderId, updateData, userId, userRole });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      const isAuthorized = (userRole === 'buyer' && order.buyerId.toString() === userId) ||
                          (userRole === 'seller' && order.sellerId.toString() === userId);

      if (!isAuthorized) {
        throw new Error("Unauthorized access to this order");
      }

      // Update allowed fields based on user role
      if (userRole === 'seller') {
        // Sellers can update delivery status
        if (updateData.deliveryStatus) {
          order.deliveryStatus = updateData.deliveryStatus;
          
          if (updateData.deliveryStatus === 'Delivered') {
            order.deliveredAt = new Date();
            order.canReview = true; // Allow buyer to review
          }
        }
      }

      // Both can update certain fields (like payment status through payment gateway)
      if (updateData.paidStatus) {
        order.paidStatus = updateData.paidStatus;
      }

      await order.save();

      // Send notifications for status changes
      const NotificationService = require("./NotificationService");
      
      if (updateData.deliveryStatus === 'Shipped') {
        await NotificationService.createNotification(
          order.buyerId,
          'Buyer',
          'order_shipped',
          'Order Shipped',
          `Your order ${order.orderId} has been shipped and is on its way.`,
          { orderId: order.orderId }
        );
      } else if (updateData.deliveryStatus === 'Delivered') {
        await NotificationService.createNotification(
          order.buyerId,
          'Buyer',
          'order_delivered',
          'Order Delivered',
          `Your order ${order.orderId} has been delivered. You can now leave a review.`,
          { orderId: order.orderId, canReview: true }
        );
      }

      this.log('updateOrderStatus completed', { orderId: order.orderId });
      return order;
    } catch (error) {
      this.handleError(error, 'updateOrderStatus');
    }
  }

  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} userRole - User role
   * @returns {Object} Cancellation result
   */
  async cancelOrder(orderId, userId, userRole) {
    try {
      this.log('cancelOrder', { orderId, userId, userRole });
      console.log('OrderService.cancelOrder called with:', { orderId, userId, userRole });

      const order = await Order.findById(orderId);
      console.log('Found order:', order ? { id: order._id, buyerId: order.buyerId, status: order.deliveryStatus } : 'null');
      
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization (only buyer can cancel)
      if (userRole !== 'buyer' || order.buyerId.toString() !== userId) {
        throw new Error("Only the buyer can cancel their own orders");
      }

      // Check if order can be cancelled
      if (order.paidStatus === 'Paid' && order.deliveryStatus !== 'Pending') {
        throw new Error("Cannot cancel order that has already been processed");
      }

      // Update order status
      order.deliveryStatus = 'Cancelled';
      order.paidStatus = 'Rejected';
      order.requestStatus = 'rejected';
      await order.save();

      // Update related request
      const request = await Request.findOne({ order: orderId });
      if (request) {
        request.status = 'rejected';
        await request.save();
      }

      // Notify seller
      const NotificationService = require("./NotificationService");
      await NotificationService.createNotification(
        order.sellerId,
        'Seller',
        'order_cancelled',
        'Order Cancelled',
        `Order ${order.orderId} has been cancelled by the buyer.`,
        { orderId: order.orderId }
      );

      this.log('cancelOrder completed', { orderId: order.orderId });
      return {
        success: true,
        message: "Order cancelled successfully",
        order: order
      };
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel order',
        error: error
      };
    }
  }

  /**
   * Delete order permanently (buyers only)
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} userRole - User role
   * @returns {Object} Deletion result
   */
  async deleteOrder(orderId, userId, userRole) {
    try {
      this.log('deleteOrder', { orderId, userId, userRole });
      console.log('OrderService.deleteOrder called with:', { orderId, userId, userRole });

      const order = await Order.findById(orderId);
      console.log('Found order:', order ? { id: order._id, buyerId: order.buyerId, status: order.deliveryStatus } : 'null');
      
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization (only buyer can delete their own orders)
      if (userRole !== 'buyer' || order.buyerId.toString() !== userId) {
        throw new Error("Only the buyer can delete their own orders");
      }

      // Check if order can be deleted (only allow deletion of cancelled or pending orders)
      if (order.paidStatus === 'Paid' && order.deliveryStatus === 'Delivered') {
        throw new Error("Cannot delete order that has been delivered and paid");
      }

      // Delete related request first
      const request = await Request.findOne({ order: orderId });
      if (request) {
        await Request.findByIdAndDelete(request._id);
        console.log('Deleted related request:', request._id);
      }

      // Delete the order
      await Order.findByIdAndDelete(orderId);
      console.log('Deleted order:', orderId);

      this.log('deleteOrder completed', { orderId });
      return {
        success: true,
        message: "Order deleted successfully"
      };
    } catch (error) {
      console.error('Error in deleteOrder:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete order',
        error: error
      };
    }
  }

  /**
   * Get order statistics for dashboard
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Object} Order statistics
   */
  async getOrderStatistics(userId, userRole) {
    try {
      this.log('getOrderStatistics', { userId, userRole });

      const filter = userRole === 'buyer' ? { buyerId: userId } : { sellerId: userId };

      const stats = await Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$deliveryStatus', 'Pending'] }, 1, 0] }
            },
            shippedOrders: {
              $sum: { $cond: [{ $eq: ['$deliveryStatus', 'Shipped'] }, 1, 0] }
            },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$deliveryStatus', 'Delivered'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$deliveryStatus', 'Cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      };

      this.log('getOrderStatistics completed', result);
      return result;
    } catch (error) {
      this.handleError(error, 'getOrderStatistics');
    }
  }

  /**
   * Confirm delivery of an order
   * @param {string} orderId - Order ID
   * @param {string} buyerId - Buyer ID (for authorization)
   * @returns {Object} Updated order
   */
  async confirmDelivery(orderId, buyerId) {
    try {
      this.log('confirmDelivery', { orderId, buyerId });

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Verify buyer owns this order
      if (order.buyerId.toString() !== buyerId) {
        throw new Error("You can only confirm delivery for your own orders");
      }

      // Check if order is paid
      if (order.paidStatus !== 'Paid') {
        throw new Error("Order must be paid before confirming delivery");
      }

      // Check if order is already delivered
      if (order.deliveryStatus === 'Delivered') {
        throw new Error("Order is already marked as delivered");
      }

      // Update order status
      order.deliveryStatus = 'Delivered';
      order.deliveredAt = new Date();
      order.canReview = true; // Allow buyer to review
      await order.save();

      // Create notifications
      const NotificationService = require("./NotificationService");
      
      // Notify seller that delivery was confirmed
      await NotificationService.createNotification(
        order.sellerId,
        'seller',
        'delivery_confirmed',
        'Delivery Confirmed!',
        `Your delivery for "${order.productName}" has been confirmed by the buyer.`,
        {
          orderId: order.orderId,
          productName: order.productName,
          buyerName: order.username,
          amount: order.totalPrice
        }
      );

      // Notify buyer that delivery is completed
      await NotificationService.createNotification(
        order.buyerId,
        'buyer',
        'delivery_completed',
        'Delivery Completed!',
        `Your order "${order.productName}" has been successfully delivered. Thank you for your purchase!`,
        {
          orderId: order.orderId,
          productName: order.productName,
          sellerName: order.sellerName,
          amount: order.totalPrice
        }
      );

      // Notify buyer that they can now review
      await NotificationService.createNotification(
        order.buyerId,
        'buyer',
        'delivery_confirmed',
        'Delivery Confirmed!',
        `Your order "${order.productName}" has been marked as delivered. You can now rate the seller!`,
        {
          orderId: order.orderId,
          productName: order.productName,
          sellerName: order.sellerName,
          amount: order.totalPrice
        }
      );

      this.log('confirmDelivery completed', { orderId });
      return order;
    } catch (error) {
      this.handleError(error, 'confirmDelivery');
    }
  }

  /**
   * Update order request status (when seller accepts/rejects)
   * @param {string} orderId - Order ID
   * @param {string} requestStatus - New request status
   * @returns {Object} Updated order
   */
  async updateOrderRequestStatus(orderId, requestStatus) {
    try {
      this.log('updateOrderRequestStatus', { orderId, requestStatus });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Update the request status
      order.requestStatus = requestStatus;
      
      // If accepted, set delivery status to Shipped (ready for payment)
      if (requestStatus === 'accepted') {
        order.deliveryStatus = 'Shipped';
      }
      
      await order.save();

      this.log('updateOrderRequestStatus completed', { orderId, requestStatus });
      return order;
    } catch (error) {
      this.handleError(error, 'updateOrderRequestStatus');
    }
  }
}

module.exports = new OrderService();
