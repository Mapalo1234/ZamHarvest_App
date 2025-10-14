const Order = require("../models/order");
const BaseService = require("./BaseService");

/**
 * Payment Service
 * Handles payment processing and business logic
 */
class PaymentService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Process payment
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment result
   */
  async processPayment(paymentData) {
    try {
      this.log('processPayment', paymentData);

      const { amount, phone, reference, orderId } = paymentData;

      // Validate order if provided
      if (orderId) {
        const order = await Order.findById(orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Check if order is rejected
        if (order.paidStatus === "Rejected") {
          throw new Error("This order has been rejected by the seller and cannot be paid for");
        }

        // Check if already paid
        if (order.paidStatus === "Paid") {
          throw new Error("This order has already been paid for");
        }
      }

      // Here you would integrate with actual payment gateway (ZynlePay)
      const paymentResult = await this.processWithPaymentGateway({
        amount,
        phone,
        reference,
        orderId
      });

      this.log('processPayment completed', { reference, status: paymentResult.status });
      return paymentResult;

    } catch (error) {
      this.handleError(error, 'processPayment');
    }
  }

  /**
   * Handle payment callback from payment gateway
   * @param {Object} callbackData - Callback data from payment gateway
   * @returns {Object} Callback processing result
   */
  async handlePaymentCallback(callbackData) {
    try {
      this.log('handlePaymentCallback', callbackData);

      const { reference_no, status, amount, transaction_id, message } = callbackData;

      if (!reference_no) {
        throw new Error("Reference number is required");
      }

      // Find the order by reference number
      const order = await Order.findOne({ orderId: reference_no });
      if (!order) {
        throw new Error(`Order not found for reference: ${reference_no}`);
      }

      // Update order based on payment status
      let updatedStatus;
      switch (status?.toLowerCase()) {
        case 'success':
        case 'completed':
        case 'paid':
          updatedStatus = 'Paid';
          order.canReview = true; // Allow buyer to review after successful payment
          break;
        case 'failed':
        case 'error':
          updatedStatus = 'Pending'; // Keep as pending for retry
          break;
        case 'cancelled':
        case 'canceled':
          updatedStatus = 'Rejected';
          break;
        default:
          updatedStatus = 'Pending';
      }

      order.paidStatus = updatedStatus;
      await order.save();

      // Send notifications based on payment status
      const NotificationService = require("./NotificationService");
      if (updatedStatus === 'Paid') {
        // Notify buyer
        await NotificationService.createNotification(
          order.buyerId,
          'buyer',
          'payment_success',
          'Payment Successful',
          `Your payment for order ${order.orderId} has been processed successfully.`,
          { orderId: order.orderId, transactionId: transaction_id, amount: order.totalPrice }
        );

        // Notify seller about payment received
        await NotificationService.createNotification(
          order.sellerId,
          'seller',
          'payment_received',
          'Payment Received',
          `You have received payment for order ${order.orderId} from ${order.username}. Amount: K${order.totalPrice}`,
          { 
            orderId: order.orderId, 
            transactionId: transaction_id, 
            amount: order.totalPrice,
            buyerName: order.username,
            productName: order.productName
          }
        );
      } else if (updatedStatus === 'Rejected') {
        await NotificationService.createNotification(
          order.buyerId,
          'buyer',
          'payment_failed',
          'Payment Failed',
          `Your payment for order ${order.orderId} has failed. ${message}`,
          { orderId: order.orderId, reason: message }
        );
      }

      this.log('handlePaymentCallback completed', { 
        reference: reference_no, 
        status: updatedStatus 
      });

      return {
        success: true,
        message: "Payment callback processed successfully",
        orderId: reference_no,
        status: updatedStatus
      };

    } catch (error) {
      this.handleError(error, 'handlePaymentCallback');
    }
  }

  /**
   * Check payment status
   * @param {string} reference - Payment reference
   * @returns {Object} Payment status
   */
  async checkPaymentStatus(reference) {
    try {
      this.log('checkPaymentStatus', { reference });

      const order = await Order.findOne({ orderId: reference })
        .populate('buyerId', 'username email')
        .populate('sellerId', 'username email')
        .populate('productId', 'name price');

      if (!order) {
        throw new Error("Order not found");
      }

      const paymentStatus = {
        orderId: order.orderId,
        paidStatus: order.paidStatus,
        totalPrice: order.totalPrice,
        deliveryStatus: order.deliveryStatus,
        buyer: order.buyerId,
        seller: order.sellerId,
        product: order.productId,
        createdAt: order.createdAt
      };

      this.log('checkPaymentStatus completed', { reference, status: order.paidStatus });
      return paymentStatus;

    } catch (error) {
      this.handleError(error, 'checkPaymentStatus');
    }
  }

  /**
   * Get payment history for user
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Array} Payment history
   */
  async getPaymentHistory(userId, role) {
    try {
      this.log('getPaymentHistory', { userId, role });

      const filter = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };

      const orders = await Order.find({
        ...filter,
        paidStatus: { $in: ['Paid', 'Rejected'] }
      })
        .populate('productId', 'name price image')
        .populate('buyerId', 'username email')
        .populate('sellerId', 'username email')
        .sort({ createdAt: -1 });

      this.log('getPaymentHistory completed', { count: orders.length });
      return orders;

    } catch (error) {
      this.handleError(error, 'getPaymentHistory');
    }
  }

  /**
   * Refund payment
   * @param {string} orderId - Order ID
   * @param {string} reason - Refund reason
   * @param {string} userId - User ID requesting refund
   * @param {string} role - User role
   * @returns {Object} Refund result
   */
  async refundPayment(orderId, reason, userId, role) {
    try {
      this.log('refundPayment', { orderId, reason, userId, role });

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      const isAuthorized = (role === 'buyer' && order.buyerId.toString() === userId) ||
                          (role === 'seller' && order.sellerId.toString() === userId);

      if (!isAuthorized) {
        throw new Error("Unauthorized access to this order");
      }

      // Check if order is paid
      if (order.paidStatus !== 'Paid') {
        throw new Error("Only paid orders can be refunded");
      }

      // Process refund with payment gateway
      const refundResult = await this.processRefundWithGateway(order, reason);

      // Update order status
      order.paidStatus = 'Refunded';
      order.deliveryStatus = 'Cancelled';
      await order.save();

      // Send notifications
      const NotificationService = require("./NotificationService");
      await NotificationService.createNotification(
        order.buyerId,
        'Buyer',
        'refund_processed',
        'Refund Processed',
        `Your refund for order ${order.orderId} has been processed. Reason: ${reason}`,
        { orderId: order.orderId, refundAmount: order.totalPrice, reason: reason }
      );

      this.log('refundPayment completed', { orderId, refundId: refundResult.refundId });
      return {
        success: true,
        message: "Refund processed successfully",
        refundId: refundResult.refundId,
        order: order
      };

    } catch (error) {
      this.handleError(error, 'refundPayment');
    }
  }

  /**
   * Process payment with payment gateway (mock implementation)
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment gateway response
   */
  async processWithPaymentGateway(paymentData) {
    // This is a mock implementation
    // In real implementation, you would integrate with ZynlePay or other payment gateway
    
    const { amount, phone, reference, orderId } = paymentData;

    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          reference: reference,
          transaction_id: `TXN-${Date.now()}`,
          status: 'pending',
          message: 'Payment initiated successfully',
          gateway_response: {
            amount: amount,
            phone: phone,
            reference: reference,
            orderId: orderId
          }
        });
      }, 1000);
    });
  }

  /**
   * Process refund with payment gateway (mock implementation)
   * @param {Object} order - Order object
   * @param {string} reason - Refund reason
   * @returns {Object} Refund response
   */
  async processRefundWithGateway(order, reason) {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          refundId: `REF-${Date.now()}`,
          amount: order.totalPrice,
          status: 'processed',
          reason: reason
        });
      }, 1000);
    });
  }
}

module.exports = new PaymentService();
