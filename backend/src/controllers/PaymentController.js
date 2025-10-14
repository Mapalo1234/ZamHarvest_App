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

    const payload = {
    auth: {
      api_id: "47a68b45-3dec-4616-9586-fab119a16030",
      merchant_id: "MEC01011",
      api_key: "d62f223f-b867-4412-8413-c288d62da930",
      channel: "API" 
    },
    data: {
      method: "runBillPayment",
      receiver_id: phone,
      reference_no: reference,
      amount: amount
    }
  };
  try {
    const response = await fetch("https://sandbox.zynlepay.com/zynlepay/jsonapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Payment API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    res.status(200).json({
      message: "Payment initiated",
      data
    });
  } catch (error) {
    console.error("Payment error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

  

  /**
   * Handle payment callback from payment gateway
   */
 paymentCallback = this.asyncHandler(async (req, res) => {
  try {
    const { response_description, reference_no } = req.body;

    console.log("Payment callback received:", req.body);

    // Default payment status
    let paidStatus = "Pending";

    if (response_description === 'SUCCESSFUL') {
      paidStatus = "paid";
    } else {
      paidStatus = "failed";
    }

    // Update the order's payment status in the database
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: reference_no },
      { paidStatus },
      { new: true }
    ).populate("sellerId buyerId", "username email"); // get seller & buyer info

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (paidStatus === "paid") {
      // Optionally call your service layer if needed
      await OrderService.updatePaidStatus(reference_no, "paid");

      return res.status(200).json({
        message: "Order marked as paid.",
        order: updatedOrder
      });
    } else {
      return res.status(400).json({
        message: "Payment not successful.",
        order: updatedOrder
      });
    }
  } catch (error) {
    console.error("Error handling callback:", error.message);
    res.status(500).json({ message: "Callback received but internal error" });
  }
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
