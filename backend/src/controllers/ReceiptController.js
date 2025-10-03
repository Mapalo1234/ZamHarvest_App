const ReceiptService = require("../services/ReceiptService");
const BaseController = require("./BaseController");

/**
 * Receipt Controller
 * Handles HTTP requests for receipt operations
 */
class ReceiptController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Get receipt data for an order
   */
  getReceipt = this.asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in to view receipt', 401);
    }

    await this.handleServiceResponse(
      res,
      ReceiptService.getReceipt(orderId, userId, role),
      'Receipt retrieved successfully'
    );
  });

  /**
   * Generate receipt PDF
   */
  generateReceiptPDF = this.asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in to generate receipt', 401);
    }

    try {
      const pdfBuffer = await ReceiptService.generateReceiptPDF(orderId, userId, role);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${orderId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      return this.sendError(res, error.message, 500, error);
    }
  });

  /**
   * Email receipt to buyer
   */
  emailReceipt = this.asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { userId, role } = this.getUserSession(req);
    const { email } = req.body;
    
    if (!userId) {
      return this.sendError(res, 'Please log in to email receipt', 401);
    }

    await this.handleServiceResponse(
      res,
      ReceiptService.emailReceipt(orderId, userId, role, email),
      'Receipt emailed successfully'
    );
  });

  /**
   * Get receipt history for user
   */
  getReceiptHistory = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in to view receipt history', 401);
    }

    const { page = 1, limit = 10 } = req.query;

    await this.handleServiceResponse(
      res,
      ReceiptService.getReceiptHistory(userId, role, {
        page: parseInt(page),
        limit: parseInt(limit)
      }),
      'Receipt history retrieved successfully'
    );
  });

  /**
   * Verify receipt authenticity
   */
  verifyReceipt = this.asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    await this.handleServiceResponse(
      res,
      ReceiptService.verifyReceipt(receiptId),
      'Receipt verification completed'
    );
  });

  /**
   * Get receipt statistics
   */
  getReceiptStats = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in to view receipt statistics', 401);
    }

    await this.handleServiceResponse(
      res,
      ReceiptService.getReceiptStats(userId, role),
      'Receipt statistics retrieved successfully'
    );
  });
}

module.exports = new ReceiptController();
