const RequestService = require("../services/RequestService");
const BaseController = require("./BaseController");

/**
 * Request Controller
 * Handles HTTP requests for request operations (seller requests from buyers)
 */
class RequestController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Get all requests for the current seller
   */
  getMyRequests = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'seller') {
      return this.sendError(res, 'Please log in as a seller to view requests', 403);
    }

    await this.handleServiceResponse(
      res,
      RequestService.getSellerRequests(userId),
      'Requests retrieved successfully'
    );
  });

  /**
   * Get requests for a specific seller (legacy route)
   */
  getSellerRequests = this.asyncHandler(async (req, res) => {
    const { sellerId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    // Check if user is authenticated
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    // Check if user is trying to access their own requests or is authorized
    if (role === 'seller' && userId !== sellerId) {
      return this.sendError(res, 'You can only view your own requests', 403);
    }

    await this.handleServiceResponse(
      res,
      RequestService.getSellerRequests(sellerId),
      'Seller requests retrieved successfully'
    );
  });

  /**
   * Update request status (accept/reject)
   */
  updateRequestStatus = this.asyncHandler(async (req, res) => {
    console.log('Update request status request received:', {
      requestId: req.params.requestId,
      status: req.body.status,
      session: req.session,
      headers: req.headers
    });
    
    const { requestId } = req.params;
    const { status } = req.body;
    const { userId, role } = this.getUserSession(req);
    
    console.log('User session data:', { userId, role });
    
    if (!userId || role !== 'seller') {
      console.log('Authentication failed:', { userId, role });
      return this.sendError(res, 'Please log in as a seller to update requests', 403);
    }

    console.log('Calling RequestService.updateRequestStatus with:', { requestId, status, userId });
    await this.handleServiceResponse(
      res,
      RequestService.updateRequestStatus(requestId, status, userId),
      'Request status updated successfully'
    );
  });

  /**
   * Get request by ID
   */
  getRequestById = this.asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      RequestService.getRequestById(requestId, userId, role),
      'Request retrieved successfully'
    );
  });

  /**
   * Get requests for a buyer
   */
  getBuyerRequests = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer', 403);
    }

    await this.handleServiceResponse(
      res,
      RequestService.getBuyerRequests(userId),
      'Buyer requests retrieved successfully'
    );
  });

  /**
   * Get request statistics
   */
  getRequestStats = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      RequestService.getRequestStats(userId, role),
      'Request statistics retrieved successfully'
    );
  });

  /**
   * Cancel a request (buyers only)
   */
  cancelRequest = this.asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { userId, role } = this.getUserSession(req);
    
    if (!userId || role !== 'buyer') {
      return this.sendError(res, 'Please log in as a buyer to cancel requests', 403);
    }

    await this.handleServiceResponse(
      res,
      RequestService.cancelRequest(requestId, userId),
      'Request cancelled successfully'
    );
  });
}

module.exports = new RequestController();
