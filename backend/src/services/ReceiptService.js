const Order = require("../models/order");
const BaseService = require("./BaseService");

/**
 * Receipt Service
 * Handles receipt generation and management business logic
 */
class ReceiptService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get receipt data for an order
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} role - User role
   * @returns {Object} Receipt data
   */
  async getReceipt(orderId, userId, role) {
    try {
      this.log('getReceipt', { orderId, userId, role });

      // Find the order
      const order = await Order.findById(orderId)
        .populate('buyerId', 'username email')
        .populate('sellerId', 'username email')
        .populate('productId', 'name price image category');

      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      const isAuthorized = (role === 'buyer' && order.buyerId._id.toString() === userId) ||
                          (role === 'seller' && order.sellerId._id.toString() === userId);

      if (!isAuthorized) {
        throw new Error("Unauthorized access to this receipt");
      }

      // Check if order is paid
      if (order.paidStatus !== "Paid") {
        throw new Error("Receipt is only available for paid orders");
      }

      // Generate receipt data
      const receiptData = {
        receiptId: `RCP-${order.orderId}`,
        orderId: order.orderId,
        orderDate: order.createdAt,
        paidDate: order.updatedAt, // Assuming updatedAt reflects payment date
        
        // Buyer information
        buyer: {
          name: order.buyerId.username,
          email: order.buyerId.email
        },
        
        // Seller information
        seller: {
          name: order.sellerId.username,
          email: order.sellerId.email
        },
        
        // Product information
        product: {
          name: order.productName,
          image: order.productId.image,
          category: order.productId.category,
          unitPrice: order.productId.price,
          quantity: order.quantity,
          unit: order.unit
        },
        
        // Payment information
        payment: {
          subtotal: order.totalPrice,
          tax: 0, // Add tax calculation if needed
          total: order.totalPrice,
          status: order.paidStatus,
          method: 'ZynlePay' // Default payment method
        },
        
        // Delivery information
        delivery: {
          status: order.deliveryStatus,
          expectedDate: order.deliveryDate,
          deliveredDate: order.deliveredAt
        },
        
        // Receipt metadata
        generatedAt: new Date(),
        isValid: true
      };

      this.log('getReceipt completed', { orderId, receiptId: receiptData.receiptId });
      return receiptData;

    } catch (error) {
      this.handleError(error, 'getReceipt');
    }
  }

  /**
   * Generate receipt PDF (mock implementation)
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Buffer} PDF buffer
   */
  async generateReceiptPDF(orderId, userId, role) {
    try {
      this.log('generateReceiptPDF', { orderId, userId, role });

      // Get receipt data
      const receiptData = await this.getReceipt(orderId, userId, role);

      // Mock PDF generation - in real implementation, use libraries like PDFKit or Puppeteer
      const pdfContent = this.generatePDFContent(receiptData);
      
      // Convert to buffer (mock implementation)
      const pdfBuffer = Buffer.from(pdfContent, 'utf8');

      this.log('generateReceiptPDF completed', { orderId, size: pdfBuffer.length });
      return pdfBuffer;

    } catch (error) {
      this.handleError(error, 'generateReceiptPDF');
    }
  }

  /**
   * Email receipt to buyer
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} email - Email address (optional)
   * @returns {Object} Email result
   */
  async emailReceipt(orderId, userId, role, email) {
    try {
      this.log('emailReceipt', { orderId, userId, role, email });

      // Get receipt data
      const receiptData = await this.getReceipt(orderId, userId, role);

      // Use buyer's email if not provided
      const targetEmail = email || receiptData.buyer.email;

      // Generate PDF
      const pdfBuffer = await this.generateReceiptPDF(orderId, userId, role);

      // Send email with receipt attachment (mock implementation)
      const emailResult = await this.sendReceiptEmail(targetEmail, receiptData, pdfBuffer);

      // Create notification
      const NotificationService = require("./NotificationService");
      await NotificationService.createNotification(
        userId,
        role === 'buyer' ? 'Buyer' : 'Seller',
        'receipt_emailed',
        'Receipt Emailed',
        `Receipt for order ${receiptData.orderId} has been sent to ${targetEmail}`,
        {
          orderId: orderId,
          receiptId: receiptData.receiptId,
          email: targetEmail
        }
      );

      this.log('emailReceipt completed', { orderId, email: targetEmail });
      return {
        success: true,
        message: "Receipt emailed successfully",
        email: targetEmail,
        receiptId: receiptData.receiptId
      };

    } catch (error) {
      this.handleError(error, 'emailReceipt');
    }
  }

  /**
   * Get receipt history for user
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Object} Receipt history with pagination
   */
  async getReceiptHistory(userId, role, options = {}) {
    try {
      this.log('getReceiptHistory', { userId, role, options });

      const { page = 1, limit = 10 } = options;
      const filter = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
      
      // Only include paid orders
      filter.paidStatus = 'Paid';

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('buyerId', 'username email')
          .populate('sellerId', 'username email')
          .populate('productId', 'name price image')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter)
      ]);

      // Transform orders to receipt format
      const receipts = orders.map(order => ({
        receiptId: `RCP-${order.orderId}`,
        orderId: order.orderId,
        orderDate: order.createdAt,
        productName: order.productName,
        totalAmount: order.totalPrice,
        status: order.paidStatus,
        deliveryStatus: order.deliveryStatus
      }));

      const result = {
        receipts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      this.log('getReceiptHistory completed', { count: receipts.length, total });
      return result;

    } catch (error) {
      this.handleError(error, 'getReceiptHistory');
    }
  }

  /**
   * Verify receipt authenticity
   * @param {string} receiptId - Receipt ID
   * @returns {Object} Verification result
   */
  async verifyReceipt(receiptId) {
    try {
      this.log('verifyReceipt', { receiptId });

      // Extract order ID from receipt ID
      const orderId = receiptId.replace('RCP-', '');

      const order = await Order.findOne({ orderId })
        .populate('buyerId', 'username')
        .populate('sellerId', 'username')
        .populate('productId', 'name');

      if (!order) {
        return {
          isValid: false,
          message: "Receipt not found or invalid"
        };
      }

      if (order.paidStatus !== 'Paid') {
        return {
          isValid: false,
          message: "Receipt is not valid - order not paid"
        };
      }

      const verificationResult = {
        isValid: true,
        message: "Receipt is valid",
        receiptId: receiptId,
        orderId: order.orderId,
        orderDate: order.createdAt,
        buyer: order.buyerId.username,
        seller: order.sellerId.username,
        product: order.productId.name,
        amount: order.totalPrice,
        verifiedAt: new Date()
      };

      this.log('verifyReceipt completed', { receiptId, isValid: true });
      return verificationResult;

    } catch (error) {
      this.handleError(error, 'verifyReceipt');
    }
  }

  /**
   * Get receipt statistics
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Object} Receipt statistics
   */
  async getReceiptStats(userId, role) {
    try {
      this.log('getReceiptStats', { userId, role });

      const filter = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
      filter.paidStatus = 'Paid';

      const stats = await Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalReceipts: { $sum: 1 },
            totalAmount: { $sum: '$totalPrice' },
            avgAmount: { $avg: '$totalPrice' },
            earliestReceipt: { $min: '$createdAt' },
            latestReceipt: { $max: '$createdAt' }
          }
        }
      ]);

      const result = stats[0] || {
        totalReceipts: 0,
        totalAmount: 0,
        avgAmount: 0,
        earliestReceipt: null,
        latestReceipt: null
      };

      result.avgAmount = Math.round(result.avgAmount * 100) / 100;

      this.log('getReceiptStats completed', result);
      return result;

    } catch (error) {
      this.handleError(error, 'getReceiptStats');
    }
  }

  /**
   * Generate PDF content (mock implementation)
   * @param {Object} receiptData - Receipt data
   * @returns {string} PDF content as string
   */
  generatePDFContent(receiptData) {
    // Mock PDF content - in real implementation, use proper PDF generation
    return `
      ZAMHARVEST MARKETPLACE RECEIPT
      ==============================
      
      Receipt ID: ${receiptData.receiptId}
      Order ID: ${receiptData.orderId}
      Date: ${receiptData.orderDate}
      
      BUYER INFORMATION:
      Name: ${receiptData.buyer.name}
      Email: ${receiptData.buyer.email}
      
      SELLER INFORMATION:
      Name: ${receiptData.seller.name}
      Email: ${receiptData.seller.email}
      
      PRODUCT DETAILS:
      Product: ${receiptData.product.name}
      Quantity: ${receiptData.product.quantity} ${receiptData.product.unit}
      Unit Price: $${receiptData.product.unitPrice}
      
      PAYMENT SUMMARY:
      Subtotal: $${receiptData.payment.subtotal}
      Tax: $${receiptData.payment.tax}
      Total: $${receiptData.payment.total}
      Status: ${receiptData.payment.status}
      
      DELIVERY INFORMATION:
      Status: ${receiptData.delivery.status}
      Expected: ${receiptData.delivery.expectedDate}
      ${receiptData.delivery.deliveredDate ? `Delivered: ${receiptData.delivery.deliveredDate}` : ''}
      
      Generated: ${receiptData.generatedAt}
      
      Thank you for using ZamHarvest Marketplace!
    `;
  }

  /**
   * Send receipt email (mock implementation)
   * @param {string} email - Email address
   * @param {Object} receiptData - Receipt data
   * @param {Buffer} pdfBuffer - PDF buffer
   * @returns {Object} Email result
   */
  async sendReceiptEmail(email, receiptData, pdfBuffer) {
    // Mock email sending - in real implementation, use nodemailer or similar
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: `MSG-${Date.now()}`,
          email: email,
          subject: `Receipt for Order ${receiptData.orderId}`,
          attachmentSize: pdfBuffer.length
        });
      }, 500);
    });
  }
}

module.exports = new ReceiptService();
