const Notification = require("../models/notification");

class NotificationService {
  // Create a notification
  static async createNotification(userId, userModel, type, title, message, data = {}) {
    try {
      const notification = new Notification({
        userId,
        userModel,
        type,
        title,
        message,
        data
      });
      
      await notification.save();
      console.log(`Notification created for ${userModel} ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Notification for new order created (for seller)
  static async notifyOrderCreated(order) {
    try {
      await this.createNotification(
        order.sellerId,
        'Seller',
        'order_created',
        'New Order Received',
        `You have received a new order for ${order.productName} from ${order.username}`,
        {
          orderId: order.orderId,
          productId: order.productId,
          amount: order.totalPrice,
          deliveryDate: order.deliveryDate
        }
      );
    } catch (error) {
      console.error("Error creating order notification:", error);
    }
  }

  // Notification for order status update (for buyer)
  static async notifyOrderUpdated(order, status) {
    try {
      await this.createNotification(
        order.buyerId,
        'Buyer',
        'order_updated',
        'Order Status Updated',
        `Your order ${order.orderId} status has been updated to ${status}`,
        {
          orderId: order.orderId,
          productId: order.productId,
          amount: order.totalPrice
        }
      );
    } catch (error) {
      console.error("Error creating order update notification:", error);
    }
  }

  // Notification for request received (for seller)
  static async notifyRequestReceived(request) {
    try {
      await this.createNotification(
        request.seller,
        'Seller',
        'request_received',
        'New Request Received',
        `You have received a new request for your product`,
        {
          requestId: request._id,
          productId: request.product
        }
      );
    } catch (error) {
      console.error("Error creating request notification:", error);
    }
  }

  // Notification for request accepted (for buyer)
  static async notifyRequestAccepted(request) {
    try {
      await this.createNotification(
        request.buyer,
        'Buyer',
        'request_accepted',
        'Request Accepted',
        `Your request has been accepted by the seller`,
        {
          requestId: request._id,
          productId: request.product
        }
      );
    } catch (error) {
      console.error("Error creating request accepted notification:", error);
    }
  }

  // Notification for request rejected (for buyer)
  static async notifyRequestRejected(request) {
    try {
      await this.createNotification(
        request.buyer,
        'Buyer',
        'request_rejected',
        'Request Rejected',
        `Your request has been rejected by the seller`,
        {
          requestId: request._id,
          productId: request.product
        }
      );
    } catch (error) {
      console.error("Error creating request rejected notification:", error);
    }
  }

  // Notification for payment received (for seller)
  static async notifyPaymentReceived(order) {
    try {
      await this.createNotification(
        order.sellerId,
        'Seller',
        'payment_received',
        'Payment Received',
        `Payment of $${order.totalPrice} received for order ${order.orderId}`,
        {
          orderId: order.orderId,
          amount: order.totalPrice
        }
      );
    } catch (error) {
      console.error("Error creating payment notification:", error);
    }
  }

  // Notification for delivery scheduled (for buyer)
  static async notifyDeliveryScheduled(order) {
    try {
      await this.createNotification(
        order.buyerId,
        'Buyer',
        'delivery_scheduled',
        'Delivery Scheduled',
        `Your order ${order.orderId} is scheduled for delivery on ${new Date(order.deliveryDate).toLocaleDateString()}`,
        {
          orderId: order.orderId,
          deliveryDate: order.deliveryDate
        }
      );
    } catch (error) {
      console.error("Error creating delivery notification:", error);
    }
  }

  // Notification for product availability (for buyers who might be interested)
  static async notifyProductAvailable(product, interestedBuyers = []) {
    try {
      for (const buyerId of interestedBuyers) {
        await this.createNotification(
          buyerId,
          'Buyer',
          'product_available',
          'Product Available',
          `A product you might be interested in is now available: ${product.name}`,
          {
            productId: product._id
          }
        );
      }
    } catch (error) {
      console.error("Error creating product availability notification:", error);
    }
  }
}

module.exports = NotificationService;
