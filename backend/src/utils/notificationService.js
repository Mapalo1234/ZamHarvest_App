const Notification = require("../models/notification");

class NotificationService {
  // Create a notification
  static async createNotification(userId, userModel, type, title, message, data = {}) {
    try {
      console.log(`Creating notification for ${userModel} ${userId}: ${type} - ${title}`);
      
      const notification = new Notification({
        userId,
        userModel,
        type,
        title,
        message,
        data
      });
      
      const savedNotification = await notification.save();
      console.log(`✅ Notification created successfully: ${savedNotification._id} for ${userModel} ${userId}: ${title}`);
      return savedNotification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      console.error("Notification data:", { userId, userModel, type, title, message, data });
      throw error;
    }
  }

  // Notification for new order created (for seller)
  static async notifyOrderCreated(order) {
    try {
      console.log("Creating order notification for seller:", order.sellerId);
      const result = await this.createNotification(
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
      if (result) {
        console.log(" Order notification created successfully");
      } else {
        console.log(" Order notification creation failed");
      }
    } catch (error) {
      console.error("Error creating order notification:", error);
    }
  }

  // Notification for order status update (for buyer)
  static async notifyOrderUpdated(order, status) {
    try {
      console.log("Creating order updated notification for buyer:", order.buyerId);
      const result = await this.createNotification(
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
      if (result) {
        console.log(" Order updated notification created successfully");
      } else {
        console.log(" Order updated notification creation failed");
      }
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
      // Populate request with order and product details for better notification
      const populatedRequest = await request.populate([
        { path: 'order', select: 'productName totalPrice quantity unit' },
        { path: 'product', select: 'name' }
      ]);
      
      const productName = populatedRequest.product?.name || populatedRequest.order?.productName || 'your product';
      const orderDetails = populatedRequest.order;
      
      await this.createNotification(
        request.buyer,
        'Buyer',
        'request_accepted',
        '🎉 Request Accepted!',
        `Great news! Your request for "${productName}" has been accepted by the seller. You can now proceed with payment.`,
        {
          requestId: request._id,
          productId: request.product,
          orderId: orderDetails?._id,
          amount: orderDetails?.totalPrice,
          quantity: orderDetails?.quantity,
          unit: orderDetails?.unit
        }
      );
    } catch (error) {
      console.error("Error creating request accepted notification:", error);
    }
  }

  // Notification for request rejected (for buyer)
  static async notifyRequestRejected(request) {
    try {
      // Populate request with order and product details for better notification
      const populatedRequest = await request.populate([
        { path: 'order', select: 'productName totalPrice quantity unit' },
        { path: 'product', select: 'name' }
      ]);
      
      const productName = populatedRequest.product?.name || populatedRequest.order?.productName || 'your product';
      
      await this.createNotification(
        request.buyer,
        'Buyer',
        'request_rejected',
        '❌ Request Rejected',
        `Unfortunately, your request for "${productName}" has been rejected by the seller. You can browse other available products.`,
        {
          requestId: request._id,
          productId: request.product,
          orderId: populatedRequest.order?._id
        }
      );
    } catch (error) {
      console.error("Error creating request rejected notification:", error);
    }
  }

  // Notification for payment received (for seller)
  static async notifyPaymentReceived(order) {
    try {
      console.log("Creating payment received notification for seller:", order.sellerId);
      const result = await this.createNotification(
        order.sellerId,
        'Seller',
        'payment_received',
        '💰 Payment Received!',
        `Great! You have received a payment of K${order.totalPrice} for "${order.productName}" (Order: ${order.orderId}). You can now proceed with delivery.`,
        {
          orderId: order.orderId,
          amount: order.totalPrice,
          productName: order.productName,
          buyerName: order.username
        }
      );
      if (result) {
        console.log("✅ Payment received notification created successfully");
      } else {
        console.log("❌ Payment received notification creation failed");
      }
    } catch (error) {
      console.error("Error creating payment notification:", error);
    }
  }

  // Notification for delivery scheduled (for buyer)
  static async notifyDeliveryScheduled(order) {
    try {
      console.log("Creating delivery scheduled notification for buyer:", order.buyerId);
      const result = await this.createNotification(
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
      if (result) {
        console.log("✅ Delivery scheduled notification created successfully");
      } else {
        console.log("❌ Delivery scheduled notification creation failed");
      }
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

  // Notification for message received (for receiver)
  static async notifyMessageReceived(message, receiverName, senderName, productName) {
    try {
      const userModel = message.senderModel === 'Buyer' ? 'Seller' : 'Buyer';
      
      await this.createNotification(
        message.receiverId, // Use the receiver's ID
        userModel,
        'message_received',
        'New Message Received',
        `${senderName} sent you a message about "${productName}": "${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}"`,
        {
          messageId: message._id,
          conversationId: message.conversationId,
          senderId: message.sender,
          text: message.text
        }
      );
    } catch (error) {
      console.error("Error creating message received notification:", error);
    }
  }

  // Notification for message sent (for sender - confirmation)
  static async notifyMessageSent(message, senderName, receiverName, productName) {
    try {
      const userModel = message.senderModel === 'Buyer' ? 'Buyer' : 'Seller';
      
      await this.createNotification(
        message.sender,
        userModel,
        'message_sent',
        'Message Sent',
        `Your message to ${receiverName} about "${productName}" has been sent successfully`,
        {
          messageId: message._id,
          conversationId: message.conversationId,
          senderId: message.sender,
          text: message.text
        }
      );
    } catch (error) {
      console.error("Error creating message sent notification:", error);
    }
  }

  // Notification for seller action confirmation (for seller)
  static async notifySellerAction(sellerId, action, productName, buyerName) {
    try {
      let title, message;
      
      if (action === 'accepted') {
        title = 'Request Accepted';
        message = `You have accepted the request for "${productName}" from ${buyerName}. The buyer can now proceed with payment.`;
      } else if (action === 'rejected') {
        title = 'Request Rejected';
        message = `You have rejected the request for "${productName}" from ${buyerName}. The buyer has been notified.`;
      }
      
      await this.createNotification(
        sellerId,
        'Seller',
        'request_updated',
        title,
        message,
        {
          productName: productName,
          buyerName: buyerName,
          action: action
        }
      );
    } catch (error) {
      console.error("Error creating seller action notification:", error);
    }
  }

  // Welcome notification for new buyers
  static async notifyBuyerWelcome(buyerId, username) {
    try {
      await this.createNotification(
        buyerId,
        'Buyer',
        'welcome',
        ' Welcome to ZamHarvest!',
        `Hi ${username}! Welcome to ZamHarvest! You can now browse and purchase fresh agricultural products from local sellers. Start exploring our marketplace!`,
        {
          username: username,
          role: 'Buyer'
        }
      );
    } catch (error) {
      console.error("Error creating buyer welcome notification:", error);
    }
  }

  // Welcome notification for new sellers
  static async notifySellerWelcome(sellerId, username) {
    try {
      await this.createNotification(
        sellerId,
        'Seller',
        'welcome',
        '🌱 Welcome to ZamHarvest!',
        `Hi ${username}! Welcome to ZamHarvest! You can now list your agricultural products and start selling to buyers. Add your first product to get started!`,
        {
          username: username,
          role: 'Seller'
        }
      );
    } catch (error) {
      console.error("Error creating seller welcome notification:", error);
    }
  }

  // Notification for delivery confirmed (for seller)
  static async notifyDeliveryConfirmed(order) {
    try {
      console.log("Creating delivery confirmed notification for seller:", order.sellerId);
      const result = await this.createNotification(
        order.sellerId,
        'Seller',
        'delivery_confirmed',
        'Delivery Confirmed!',
        `Great! Your delivery for "${order.productName}" (Order: ${order.orderId}) has been confirmed by the buyer. You can now expect a review soon!`,
        {
          orderId: order.orderId,
          productName: order.productName,
          buyerName: order.username,
          amount: order.totalPrice
        }
      );
      if (result) {
        console.log("✅ Delivery confirmed notification created successfully");
      } else {
        console.log("❌ Delivery confirmed notification creation failed");
      }
    } catch (error) {
      console.error("Error creating delivery confirmed notification:", error);
    }
  }

  // Notification for delivery confirmed (for buyer)
  static async notifyDeliveryConfirmedBuyer(order) {
    try {
      console.log("Creating delivery confirmed buyer notification for buyer:", order.buyerId);
      const result = await this.createNotification(
        order.buyerId,
        'Buyer',
        'delivery_confirmed',
        ' Delivery Confirmed!',
        `Your order "${order.productName}" (Order: ${order.orderId}) has been marked as delivered. You can now rate the seller!`,
        {
          orderId: order.orderId,
          productName: order.productName,
          sellerName: order.sellerName,
          amount: order.totalPrice
        }
      );
      if (result) {
        console.log("✅ Delivery confirmed buyer notification created successfully");
      } else {
        console.log("❌ Delivery confirmed buyer notification creation failed");
      }
    } catch (error) {
      console.error("Error creating delivery confirmed buyer notification:", error);
    }
  }

  // Notification for seller rating received (for seller)
  static async notifySellerRated(sellerId, rating, review, productName, buyerName) {
    try {
      console.log("Creating seller rated notification for seller:", sellerId);
      const starText = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const pointsEarned = rating * 0.2; // 5 stars = 1 point, 4 stars = 0.8 points, etc.
      const result = await this.createNotification(
        sellerId,
        'Seller',
        'seller_rated',
        '⭐ New Rating Received!',
        `You received a ${rating}-star rating from ${buyerName} for "${productName}" (+${pointsEarned} points): "${review.substring(0, 100)}${review.length > 100 ? '...' : ''}"`,
        {
          rating: rating,
          review: review,
          productName: productName,
          buyerName: buyerName,
          starText: starText,
          pointsEarned: pointsEarned
        }
      );
      if (result) {
        console.log("Seller rated notification created successfully");
      } else {
        console.log(" Seller rated notification creation failed");
      }
    } catch (error) {
      console.error("Error creating seller rated notification:", error);
    }
  }

  // Notification for review submitted (for buyer)
  static async notifyReviewSubmitted(buyerId, rating, productName, sellerName) {
    try {
      console.log("Creating review submitted notification for buyer:", buyerId);
      const starText = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const result = await this.createNotification(
        buyerId,
        'Buyer',
        'review_submitted',
        '⭐ Review Submitted!',
        `Thank you! Your ${rating}-star review for "${productName}" from ${sellerName} has been submitted successfully.`,
        {
          rating: rating,
          productName: productName,
          sellerName: sellerName,
          starText: starText
        }
      );
      if (result) {
        console.log("✅ Review submitted notification created successfully");
      } else {
        console.log("❌ Review submitted notification creation failed");
      }
    } catch (error) {
      console.error("Error creating review submitted notification:", error);
    }
  }
}

module.exports = NotificationService;
