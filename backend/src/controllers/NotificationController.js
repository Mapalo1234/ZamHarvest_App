const NotificationService = require("../services/NotificationService");
const BaseController = require("./BaseController");

/**
 * Notification Controller
 * Handles HTTP requests for notification operations
 */
class NotificationController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Create a new notification
   */
  createNotification = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    const { type, title, message, data = {} } = req.body;

    await this.handleServiceResponse(
      res,
      NotificationService.createNotification(userId, role, type, title, message, data),
      'Notification created successfully',
      201
    );
  });

  /**
   * Get notifications for current user
   */
  getNotifications = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    await this.handleServiceResponse(
      res,
      NotificationService.getUserNotifications(userId, role, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
      }),
      'Notifications retrieved successfully'
    );
  });

  /**
   * Mark notification as read
   */
  markAsRead = this.asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const { userId } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      NotificationService.markAsRead(notificationId, userId),
      'Notification marked as read'
    );
  });

  /**
   * Mark all notifications as read
   */
  markAllAsRead = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      NotificationService.markAllAsRead(userId, role),
      'All notifications marked as read'
    );
  });

  /**
   * Delete notification
   */
  deleteNotification = this.asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const { userId } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      NotificationService.deleteNotification(notificationId, userId),
      'Notification deleted successfully'
    );
  });

  /**
   * Get unread notification count
   */
  getUnreadCount = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      NotificationService.getUnreadCount(userId, role),
      'Unread count retrieved successfully'
    );
  });

  /**
   * Get notification statistics
   */
  getNotificationStats = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      NotificationService.getNotificationStats(userId, role),
      'Notification statistics retrieved successfully'
    );
  });
}

module.exports = new NotificationController();
