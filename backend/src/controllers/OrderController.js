const OrderService = require("../services/OrderService");
const BaseController = require("./BaseController");

/**
 * Order Controller
 * Handles HTTP requests for order operations
 */
class OrderController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Create a new order (buyers only)
   */
  createOrder = this.asyncHandler(async (req, res) => {
    const { userId, role, username } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    await this.handleServiceResponse(
      res,
      OrderService.createOrder(req.body, userId, username),
      'Order created successfully',
      201
    );
  });

  /**
   * Get orders by buyer ID
   */
  getOrdersByBuyer = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    await this.handleServiceResponse(
      res,
      OrderService.getOrdersByBuyer(userId),
      'Orders retrieved successfully'
    );
  });

  /**
   * Get orders by seller ID
   */
  getOrdersBySeller = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'seller') {
      return this.sendError(res, 'Please log in as a seller', 403);
    }

    await this.handleServiceResponse(
      res,
      OrderService.getOrdersBySeller(userId),
      'Orders retrieved successfully'
    );
  });

  /**
   * Get order by ID
   */
  getOrderById = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { id } = req.params;
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      OrderService.getOrderById(id, userId, role),
      'Order retrieved successfully'
    );
  });

  /**
   * Update order status
   */
  updateOrderStatus = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { id } = req.params;
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      OrderService.updateOrderStatus(id, req.body, userId, role),
      'Order status updated successfully'
    );
  });

  /**
   * Cancel order (buyers only)
   */
  cancelOrder = this.asyncHandler(async (req, res) => {
    console.log('Cancel order request received:', {
      orderId: req.params.id,
      session: req.session,
      headers: req.headers
    });
    
    const { userId, role } = this.getUserSession(req);
    const { id } = req.params;
    
    console.log('User session data:', { userId, role });
    
    if (!userId || role !== 'buyer') {
      console.log('Authentication failed:', { userId, role });
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    console.log('Calling OrderService.cancelOrder with:', { id, userId, role });
    await this.handleServiceResponse(
      res,
      OrderService.cancelOrder(id, userId, role),
      'Order cancelled successfully'
    );
  });

  /**
   * Delete order permanently (buyers only)
   */
  deleteOrder = this.asyncHandler(async (req, res) => {
    console.log('Delete order request received:', {
      orderId: req.params.id,
      session: req.session,
      headers: req.headers
    });
    
    const { userId, role } = this.getUserSession(req);
    const { id } = req.params;
    
    console.log('User session data:', { userId, role });
    
    if (!userId || role !== 'buyer') {
      console.log('Authentication failed:', { userId, role });
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    console.log('Calling OrderService.deleteOrder with:', { id, userId, role });
    await this.handleServiceResponse(
      res,
      OrderService.deleteOrder(id, userId, role),
      'Order deleted successfully'
    );
  });

  /**
   * Get order statistics for dashboard
   */
  getOrderStatistics = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      OrderService.getOrderStatistics(userId, role),
      'Order statistics retrieved successfully'
    );
  });

  /**
   * Get user's orders (generic endpoint)
   */
  getUserOrders = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    const serviceMethod = role === 'buyer' 
      ? OrderService.getOrdersByBuyer(userId)
      : OrderService.getOrdersBySeller(userId);

    await this.handleServiceResponse(
      res,
      serviceMethod,
      'Orders retrieved successfully'
    );
  });

  /**
   * Confirm delivery of an order (buyers only)
   */
  confirmDelivery = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { orderId } = req.params;
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    await this.handleServiceResponse(
      res,
      OrderService.confirmDelivery(orderId, userId),
      'Delivery confirmed successfully'
    );
  });
}

module.exports = new OrderController();
