const PaymentService = require("../services/PaymentService");
const BaseController = require("./BaseController");
const Order = require("../models/order");

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
  const { amount, phone, orderId } = req.body;

  console.log("Incoming payment request:", req.body);

  // Fetch the order using orderId
  const order = await Order.findById(orderId);
  if (!order) {
    return this.sendError(res, "Order not found", 404);
  }

  const referenceNo = order.referenceNo; // or order.reference_no, depending on your schema
  console.log("Using reference number:", referenceNo);
  // Validate required fields
  if (!amount || !phone || !referenceNo) {
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
      reference_no: referenceNo,
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
    // Log the raw callback for debugging
    console.log("Payment callback received:", req.body);

    // Extract values from callback
    const { response_description, reference_no } = req.body;

    if (!reference_no) {
      return res.status(400).json({ message: "Missing reference_no in callback" });
    }

    // Determine paid status based on callback description
    let paidStatus;
    if (response_description && response_description.toUpperCase() === "SUCCESSFUL") {
      paidStatus = "Paid";
    } else {
      paidStatus = "Failed";
    }

    // Find and update the matching order by reference number
    const updatedOrder = await Order.findOneAndUpdate(
      { referenceNo: reference_no },        // Match reference number in your DB
      { paidStatus },                       // Update payment status
      { new: true }                         // Return the updated document
    ).populate("sellerId buyerId", "username email");

    if (!updatedOrder) {
      console.warn("No order found with reference number:", reference_no);
      return res.status(404).json({ message: "Order not found for given reference number" });
    }

    // Optionally trigger your internal service to update other systems
    if (paidStatus === "paid" && OrderService.updatePaidStatus) {
      await OrderService.updatePaidStatus(reference_no, paidStatus);
    }

    // Respond to the payment gateway immediately
    return res.status(200).json({
      message: `Order payment status updated to '${paidStatus}'`,
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Error handling payment callback:", error);
    return res.status(500).json({ message: "Internal server error processing callback" });
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
