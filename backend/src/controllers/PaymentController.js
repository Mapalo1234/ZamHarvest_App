const PaymentService = require("../services/PaymentService");
const BaseController = require("./BaseController");

/**
 * Payment Controller
 * Handles HTTP requests for payment operations
 */
class PaymentController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Process payment
   */
  processPayment = this.asyncHandler(async (req, res) => {
    const { amount, phone, reference, orderId } = req.body;
    
    console.log("Incoming payment request:", req.body);

    // Validate required fields
    if (!amount || !phone || !reference) {
      return this.sendError(res, "Missing required fields", 400);
    }

    await this.handleServiceResponse(
      res,
      PaymentService.processPayment({ amount, phone, reference, orderId }),
      'Payment processed successfully',
      200
    );
  });

  /**
   * Handle payment callback from payment gateway
   */
  paymentCallback = this.asyncHandler(async (req, res) => {
    const callbackData = req.body;
    
    console.log("Payment callback received:", callbackData);

    await this.handleServiceResponse(
      res,
      PaymentService.handlePaymentCallback(callbackData),
      'Payment callback processed successfully',
      200
    );
  });

  /**
   * Check payment status
   */
  checkPaymentStatus = this.asyncHandler(async (req, res) => {
    const { reference } = req.params;

    await this.handleServiceResponse(
      res,
      PaymentService.checkPaymentStatus(reference),
      'Payment status retrieved successfully'
    );
  });

  /**
   * Get payment history for user
   */
  getPaymentHistory = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      PaymentService.getPaymentHistory(userId, role),
      'Payment history retrieved successfully'
    );
  });

  /**
   * Refund payment
   */
  refundPayment = this.asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      PaymentService.refundPayment(orderId, reason, userId, role),
      'Payment refund processed successfully'
    );
  });
}

module.exports = new PaymentController();
