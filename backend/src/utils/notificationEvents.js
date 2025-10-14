/**
 * Notification Event Handler
 * Centralized notification system for all events in the application
 */

const NotificationService = require("../services/NotificationService");

class NotificationEvents {
  /**
   * Handle order-related notifications
   */
  static async handleOrderEvents(event, data) {
    try {
      switch (event) {
        case 'order_created':
          await this.notifyOrderCreated(data);
          break;
        case 'order_updated':
          await this.notifyOrderUpdated(data);
          break;
        case 'order_cancelled':
          await this.notifyOrderCancelled(data);
          break;
        case 'order_delivered':
          await this.notifyOrderDelivered(data);
          break;
        case 'order_completed':
          await this.notifyOrderCompleted(data);
          break;
        default:
          console.log(`Unknown order event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling order event ${event}:`, error);
    }
  }

  /**
   * Handle payment-related notifications
   */
  static async handlePaymentEvents(event, data) {
    try {
      switch (event) {
        case 'payment_success':
          await this.notifyPaymentSuccess(data);
          break;
        case 'payment_failed':
          await this.notifyPaymentFailed(data);
          break;
        case 'payment_received':
          await this.notifyPaymentReceived(data);
          break;
        default:
          console.log(`Unknown payment event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling payment event ${event}:`, error);
    }
  }

  /**
   * Handle request-related notifications
   */
  static async handleRequestEvents(event, data) {
    try {
      switch (event) {
        case 'request_received':
          await this.notifyRequestReceived(data);
          break;
        case 'request_accepted':
          await this.notifyRequestAccepted(data);
          break;
        case 'request_rejected':
          await this.notifyRequestRejected(data);
          break;
        default:
          console.log(`Unknown request event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling request event ${event}:`, error);
    }
  }

  /**
   * Handle review-related notifications
   */
  static async handleReviewEvents(event, data) {
    try {
      switch (event) {
        case 'review_submitted':
          await this.notifyReviewSubmitted(data);
          break;
        case 'seller_rated':
          await this.notifySellerRated(data);
          break;
        default:
          console.log(`Unknown review event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling review event ${event}:`, error);
    }
  }

  /**
   * Handle message-related notifications
   */
  static async handleMessageEvents(event, data) {
    try {
      switch (event) {
        case 'message_received':
          await this.notifyMessageReceived(data);
          break;
        case 'message_sent':
          await this.notifyMessageSent(data);
          break;
        default:
          console.log(`Unknown message event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling message event ${event}:`, error);
    }
  }

  /**
   * Handle product-related notifications
   */
  static async handleProductEvents(event, data) {
    try {
      switch (event) {
        case 'product_added':
          await this.notifyProductAdded(data);
          break;
        case 'product_updated':
          await this.notifyProductUpdated(data);
          break;
        case 'product_out_of_stock':
          await this.notifyProductOutOfStock(data);
          break;
        case 'low_stock':
          await this.notifyLowStock(data);
          break;
        default:
          console.log(`Unknown product event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling product event ${event}:`, error);
    }
  }

  /**
   * Handle user-related notifications
   */
  static async handleUserEvents(event, data) {
    try {
      switch (event) {
        case 'user_registered':
          await this.notifyUserRegistered(data);
          break;
        case 'welcome':
          await this.notifyWelcome(data);
          break;
        default:
          console.log(`Unknown user event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling user event ${event}:`, error);
    }
  }

  // Order notification methods
  static async notifyOrderCreated(data) {
    const { order, buyerId, sellerId } = data;
    
    // Notify buyer
    await NotificationService.createNotification(
      buyerId,
      'buyer',
      'order_created',
      'Order Confirmed',
      `Your order for ${order.productName} has been confirmed and is being processed.`,
      {
        orderId: order.orderId,
        productId: order.productId,
        amount: order.totalPrice,
        deliveryDate: order.deliveryDate
      }
    );

    // Notify seller
    await NotificationService.createNotification(
      sellerId,
      'seller',
      'request_received',
      'New Order Request',
      `You have received a new order request for ${order.productName}.`,
      {
        orderId: order.orderId,
        productId: order.productId,
        buyerName: order.username
      }
    );
  }

  static async notifyOrderUpdated(data) {
    const { order, status } = data;
    
    await NotificationService.createNotification(
      order.buyerId,
      'buyer',
      'order_updated',
      'Order Status Updated',
      `Your order ${order.orderId} status has been updated to ${status}.`,
      {
        orderId: order.orderId,
        productId: order.productId,
        amount: order.totalPrice,
        status: status
      }
    );
  }

  static async notifyOrderCancelled(data) {
    const { order, reason } = data;
    
    await NotificationService.createNotification(
      order.buyerId,
      'buyer',
      'order_cancelled',
      'Order Cancelled',
      `Your order ${order.orderId} has been cancelled. ${reason || ''}`,
      {
        orderId: order.orderId,
        productId: order.productId,
        reason: reason
      }
    );
  }

  static async notifyOrderDelivered(data) {
    const { order } = data;
    
    // Notify buyer
    await NotificationService.createNotification(
      order.buyerId,
      'buyer',
      'order_delivered',
      'Order Delivered',
      `Your order ${order.orderId} has been delivered successfully.`,
      {
        orderId: order.orderId,
        productId: order.productId
      }
    );

    // Notify seller
    await NotificationService.createNotification(
      order.sellerId,
      'seller',
      'delivery_confirmed',
      'Delivery Confirmed',
      `Your delivery for order ${order.orderId} has been confirmed by the buyer.`,
      {
        orderId: order.orderId,
        productId: order.productId,
        buyerName: order.username
      }
    );
  }

  static async notifyOrderCompleted(data) {
    const { order } = data;
    
    await NotificationService.createNotification(
      order.buyerId,
      'buyer',
      'order_completed',
      'Order Completed',
      `Your order ${order.orderId} has been completed successfully. Thank you for your purchase!`,
      {
        orderId: order.orderId,
        productId: order.productId
      }
    );
  }

  // Payment notification methods
  static async notifyPaymentSuccess(data) {
    const { order, transactionId } = data;
    
    // Notify buyer
    await NotificationService.createNotification(
      order.buyerId,
      'buyer',
      'payment_success',
      'Payment Successful',
      `Your payment for order ${order.orderId} has been processed successfully.`,
      {
        orderId: order.orderId,
        transactionId: transactionId,
        amount: order.totalPrice
      }
    );

    // Notify seller
    await NotificationService.createNotification(
      order.sellerId,
      'seller',
      'payment_received',
      'Payment Received',
      `You have received payment for order ${order.orderId} from ${order.username}. Amount: K${order.totalPrice}`,
      {
        orderId: order.orderId,
        transactionId: transactionId,
        amount: order.totalPrice,
        buyerName: order.username,
        productName: order.productName
      }
    );
  }

  static async notifyPaymentFailed(data) {
    const { order, reason } = data;
    
    await NotificationService.createNotification(
      order.buyerId,
      'buyer',
      'payment_failed',
      'Payment Failed',
      `Your payment for order ${order.orderId} has failed. ${reason || ''}`,
      {
        orderId: order.orderId,
        reason: reason
      }
    );
  }

  // Request notification methods
  static async notifyRequestReceived(data) {
    const { request, productName, buyerName } = data;
    
    await NotificationService.createNotification(
      request.seller,
      'seller',
      'request_received',
      'New Order Request',
      `You have received a new order request for ${productName} from ${buyerName}.`,
      {
        requestId: request._id,
        productId: request.product,
        buyerName: buyerName
      }
    );
  }

  static async notifyRequestAccepted(data) {
    const { request, productName } = data;
    
    await NotificationService.createNotification(
      request.buyer,
      'buyer',
      'request_accepted',
      'Request Accepted',
      `Your request for ${productName} has been accepted by the seller. You can now proceed with payment.`,
      {
        requestId: request._id,
        productId: request.product
      }
    );
  }

  static async notifyRequestRejected(data) {
    const { request, productName } = data;
    
    await NotificationService.createNotification(
      request.buyer,
      'buyer',
      'request_rejected',
      'Request Rejected',
      `Your request for ${productName} has been rejected by the seller.`,
      {
        requestId: request._id,
        productId: request.product
      }
    );
  }

  // Review notification methods
  static async notifyReviewSubmitted(data) {
    const { review, productName, buyerName } = data;
    
    await NotificationService.createNotification(
      review.buyerId,
      'buyer',
      'review_submitted',
      'Review Submitted',
      `Thank you! Your ${review.rating}-star review for "${productName}" has been submitted successfully.`,
      {
        reviewId: review._id,
        productId: review.productId,
        rating: review.rating,
        productName: productName
      }
    );
  }

  static async notifySellerRated(data) {
    const { review, productName, buyerName } = data;
    
    await NotificationService.createNotification(
      review.sellerId,
      'seller',
      'seller_rated',
      'New Review Received',
      `You received a ${review.rating}-star review from ${buyerName} for "${productName}".`,
      {
        reviewId: review._id,
        productId: review.productId,
        rating: review.rating,
        buyerName: buyerName,
        productName: productName
      }
    );
  }

  // Message notification methods
  static async notifyMessageReceived(data) {
    const { message, receiverId, receiverType, productName, senderName } = data;
    
    await NotificationService.createNotification(
      receiverId,
      receiverType,
      'message_received',
      'New Message',
      `You have a new message from ${senderName} about ${productName}.`,
      {
        messageId: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: senderName
      }
    );
  }

  static async notifyMessageSent(data) {
    const { message, senderId, senderType, receiverName, productName } = data;
    
    await NotificationService.createNotification(
      senderId,
      senderType,
      'message_sent',
      'Message Sent',
      `Your message to ${receiverName} about ${productName} has been sent successfully.`,
      {
        messageId: message._id,
        conversationId: message.conversationId,
        receiverName: receiverName
      }
    );
  }

  // Product notification methods
  static async notifyProductAdded(data) {
    const { product, sellerId } = data;
    
    await NotificationService.createNotification(
      sellerId,
      'seller',
      'product_added',
      'Product Added Successfully',
      `Your product "${product.name}" has been added to the marketplace and is now available for buyers.`,
      {
        productId: product._id,
        productName: product.name,
        category: product.category,
        price: product.price
      }
    );
  }

  static async notifyProductUpdated(data) {
    const { product, sellerId } = data;
    
    await NotificationService.createNotification(
      sellerId,
      'seller',
      'product_updated',
      'Product Updated',
      `Your product "${product.name}" has been updated successfully.`,
      {
        productId: product._id,
        productName: product.name
      }
    );
  }

  static async notifyProductOutOfStock(data) {
    const { product, sellerId } = data;
    
    await NotificationService.createNotification(
      sellerId,
      'seller',
      'product_out_of_stock',
      'Product Out of Stock',
      `Your product "${product.name}" is now out of stock. Consider restocking.`,
      {
        productId: product._id,
        productName: product.name
      }
    );
  }

  static async notifyLowStock(data) {
    const { product, sellerId, currentStock } = data;
    
    await NotificationService.createNotification(
      sellerId,
      'seller',
      'low_stock',
      'Low Stock Alert',
      `Your product "${product.name}" is running low on stock (${currentStock} remaining). Consider restocking.`,
      {
        productId: product._id,
        productName: product.name,
        currentStock: currentStock
      }
    );
  }

  // User notification methods
  static async notifyUserRegistered(data) {
    const { user, role } = data;
    
    await NotificationService.createNotification(
      user.id,
      role,
      'user_registered',
      'Account Created',
      `Welcome to ZamHarvest! Your ${role} account has been created successfully.`,
      {
        userId: user.id,
        userType: role
      }
    );
  }

  static async notifyWelcome(data) {
    const { userId, role, username } = data;
    
    const message = role === 'buyer' 
      ? `Welcome to ZamHarvest! Start exploring fresh agricultural products from local farmers.`
      : `Welcome to ZamHarvest! Start listing your agricultural products and connect with buyers.`;
    
    await NotificationService.createNotification(
      userId,
      role,
      'welcome',
      'Welcome to ZamHarvest!',
      message,
      {
        userId: userId,
        userType: role,
        username: username
      }
    );
  }
}

module.exports = NotificationEvents;
