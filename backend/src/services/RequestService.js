const Request = require("../models/request");
const Order = require("../models/order");
const BaseService = require("./BaseService");

/**
 * Request Service
 * Handles request management and business logic
 */
class RequestService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get requests for a seller
   * @param {string} sellerId - Seller ID
   * @returns {Array} Array of requests
   */
  async getSellerRequests(sellerId) {
    try {
      this.log('getSellerRequests', { sellerId });

      const requests = await Request.find({ seller: sellerId })
        .populate("buyer", "username email")
        .populate("product", "name price image")
        .populate("order")
        .sort({ createdAt: -1 });

      this.log('getSellerRequests completed', { count: requests.length });
      return {
        count: requests.length,
        requests
      };

    } catch (error) {
      this.handleError(error, 'getSellerRequests');
    }
  }

  /**
   * Update request status
   * @param {string} requestId - Request ID
   * @param {string} status - New status
   * @param {string} sellerId - Seller ID (for authorization)
   * @returns {Object} Updated request
   */
  async updateRequestStatus(requestId, status, sellerId) {
    try {
      this.log('updateRequestStatus', { requestId, status, sellerId });
      console.log('RequestService.updateRequestStatus called with:', { requestId, status, sellerId });

      // Validate status
      console.log('Validating status:', status, 'Type:', typeof status);
      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        console.error('Invalid status received:', status);
        throw new Error("Invalid status. Must be pending, accepted, or rejected");
      }

      const request = await Request.findById(requestId).populate('order');
      console.log('Found request:', request ? { id: request._id, status: request.status, seller: request.seller } : 'null');
      
      if (!request) {
        throw new Error("Request not found");
      }

      // Verify the request belongs to the current seller
      if (request.seller.toString() !== sellerId) {
        throw new Error("Unauthorized access to this request");
      }

      // Update request status
      const oldStatus = request.status;
      request.status = status;
      await request.save();

      // Update the corresponding order's status based on request status
      let order = null;
      if (request.order && request.order._id) {
        order = await Order.findById(request.order._id);
        if (order) {
        // Update request status in order
        order.requestStatus = status;
        
        if (status === 'accepted') {
          order.paidStatus = "Pending"; // Ready for payment
          order.deliveryStatus = "Shipped"; // Ready for delivery after payment
        } else if (status === 'rejected') {
          order.paidStatus = "Rejected"; // Not available for payment
          order.deliveryStatus = "Cancelled"; // Cancelled delivery
        } else {
          order.paidStatus = "Pending"; // Still waiting for seller decision
        }
        await order.save();
        }
      } else {
        console.log('Warning: Request has no associated order, skipping order update');
      }

      // Send notifications based on status change
      const NotificationService = require("./NotificationService");
      
      if (status === 'accepted') {
        await NotificationService.createNotification(
          request.buyer,
          'buyer',
          'request_accepted',
          'Request Accepted',
          `Your request has been accepted by the seller. You can now proceed with payment.`,
          { requestId: requestId, orderId: order?._id }
        );

        // Add delivery scheduled notification
        if (order) {
          await NotificationService.createNotification(
            request.buyer,
            'buyer',
            'delivery_scheduled',
            'Delivery Scheduled',
            `Your order ${order.orderId} is scheduled for delivery on ${new Date(order.deliveryDate).toLocaleDateString()}.`,
            { 
              orderId: order.orderId, 
              deliveryDate: order.deliveryDate,
              productName: order.productName
            }
          );
        }
      } else if (status === 'rejected') {
        await NotificationService.createNotification(
          request.buyer,
          'buyer',
          'request_rejected',
          'Request Rejected',
          `Your request has been rejected by the seller.`,
          { requestId: requestId, orderId: order?._id }
        );
      }

      // Send confirmation notification to seller
      await NotificationService.createNotification(
        sellerId,
        'seller',
        'request_updated',
        'Request Updated',
        `You have ${status} a request from ${request.buyer?.username || 'a buyer'}.`,
        {
          requestId: requestId,
          status: status,
          oldStatus: oldStatus,
          orderId: order?._id
        }
      );

      this.log('updateRequestStatus completed', { requestId, status });
      return {
        success: true,
        message: "Request status updated successfully",
        request: {
          id: request._id,
          status: request.status,
          oldStatus: oldStatus
        }
      };

    } catch (error) {
      console.error('Error in updateRequestStatus:', error);
      return {
        success: false,
        message: error.message || 'Failed to update request status',
        error: error
      };
    }
  }

  /**
   * Get request by ID
   * @param {string} requestId - Request ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} role - User role
   * @returns {Object} Request data
   */
  async getRequestById(requestId, userId, role) {
    try {
      this.log('getRequestById', { requestId, userId, role });

      const request = await Request.findById(requestId)
        .populate("buyer", "username email")
        .populate("seller", "username email")
        .populate("product", "name price image")
        .populate("order");

      if (!request) {
        throw new Error("Request not found");
      }

      // Check authorization
      const isAuthorized = (role === 'buyer' && request.buyer._id.toString() === userId) ||
                          (role === 'seller' && request.seller._id.toString() === userId);

      if (!isAuthorized) {
        throw new Error("Unauthorized access to this request");
      }

      this.log('getRequestById completed', { requestId });
      return request;

    } catch (error) {
      this.handleError(error, 'getRequestById');
    }
  }

  /**
   * Get requests for a buyer
   * @param {string} buyerId - Buyer ID
   * @returns {Array} Array of requests
   */
  async getBuyerRequests(buyerId) {
    try {
      this.log('getBuyerRequests', { buyerId });

      const requests = await Request.find({ buyer: buyerId })
        .populate("seller", "username email")
        .populate("product", "name price image")
        .populate("order")
        .sort({ createdAt: -1 });

      this.log('getBuyerRequests completed', { count: requests.length });
      return {
        count: requests.length,
        requests
      };

    } catch (error) {
      this.handleError(error, 'getBuyerRequests');
    }
  }

  /**
   * Get request statistics
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Object} Request statistics
   */
  async getRequestStats(userId, role) {
    try {
      this.log('getRequestStats', { userId, role });

      const filter = role === 'buyer' ? { buyer: userId } : { seller: userId };

      const stats = await Request.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pendingRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            acceptedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
            },
            rejectedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalRequests: 0,
        pendingRequests: 0,
        acceptedRequests: 0,
        rejectedRequests: 0
      };

      this.log('getRequestStats completed', result);
      return result;

    } catch (error) {
      this.handleError(error, 'getRequestStats');
    }
  }

  /**
   * Cancel a request (buyers only)
   * @param {string} requestId - Request ID
   * @param {string} buyerId - Buyer ID (for authorization)
   * @returns {Object} Cancellation result
   */
  async cancelRequest(requestId, buyerId) {
    try {
      this.log('cancelRequest', { requestId, buyerId });

      const request = await Request.findById(requestId).populate('order');
      if (!request) {
        throw new Error("Request not found");
      }

      // Check ownership
      if (request.buyer.toString() !== buyerId) {
        throw new Error("You can only cancel your own requests");
      }

      // Check if request can be cancelled
      if (request.status === 'accepted') {
        throw new Error("Cannot cancel an accepted request");
      }

      // Update request status
      request.status = 'rejected';
      await request.save();

      // Update corresponding order
      if (request.order) {
        const order = await Order.findById(request.order._id);
        if (order) {
          order.paidStatus = 'Rejected';
          order.deliveryStatus = 'Cancelled';
          await order.save();
        }
      }

      // Notify seller
      const NotificationService = require("./NotificationService");
      await NotificationService.createNotification(
        request.seller,
        'Seller',
        'request_cancelled',
        'Request Cancelled',
        `A buyer has cancelled their request for your product.`,
        {
          requestId: requestId,
          productId: request.product
        }
      );

      this.log('cancelRequest completed', { requestId });
      return {
        success: true,
        message: "Request cancelled successfully",
        request: request
      };

    } catch (error) {
      this.handleError(error, 'cancelRequest');
    }
  }

  /**
   * Get pending requests count for seller
   * @param {string} sellerId - Seller ID
   * @returns {number} Pending requests count
   */
  async getPendingRequestsCount(sellerId) {
    try {
      this.log('getPendingRequestsCount', { sellerId });

      const count = await Request.countDocuments({
        seller: sellerId,
        status: 'pending'
      });

      this.log('getPendingRequestsCount completed', { count });
      return { count };

    } catch (error) {
      this.handleError(error, 'getPendingRequestsCount');
    }
  }
}

module.exports = new RequestService();
