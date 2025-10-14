const mongoose = require("mongoose");
const Notification = require("../models/notification");
const BaseService = require("./BaseService");

/**
 * Notification Service
 * Handles notification creation and management business logic
 */
class NotificationService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Create a new notification
   * @param {string} userId - User ID
   * @param {string} role - User role (buyer/seller)
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} data - Additional data
   * @returns {Object} Created notification
   */
  async createNotification(userId, role, type, title, message, data = {}) {
    try {
      this.log('createNotification', { userId, role, type, title });

      this.validateRequired({ userId, role, type, title, message }, 
        ['userId', 'role', 'type', 'title', 'message']);

      const userModel = role === 'buyer' ? 'Buyer' : 'Seller';

      const notification = new Notification({
        userId: mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId(userId),
        userModel,
        type,
        title,
        message,
        data,
        isRead: false
      });

      await notification.save();

      this.log('createNotification completed', { notificationId: notification._id });
      return notification;

    } catch (error) {
      this.handleError(error, 'createNotification');
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Object} Notifications with pagination
   */
  async getUserNotifications(userId, role, options = {}) {
    try {
      this.log('getUserNotifications', { userId, role, options });

      const { page = 1, limit = 20, unreadOnly = false } = options;
      const userModel = role === 'buyer' ? 'Buyer' : 'Seller';

      const filter = {
        userId,
        userModel
      };

      if (unreadOnly) {
        filter.isRead = false;
      }

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, userModel, isRead: false })
      ]);

      const result = {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      this.log('getUserNotifications completed', { 
        count: notifications.length, 
        total 
      });
      return result;

    } catch (error) {
      this.handleError(error, 'getUserNotifications');
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      this.log('markAsRead', { notificationId, userId });

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error("Notification not found");
      }

      // Check ownership
      if (notification.userId.toString() !== userId) {
        throw new Error("Unauthorized access to this notification");
      }

      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      this.log('markAsRead completed', { notificationId });
      return notification;

    } catch (error) {
      this.handleError(error, 'markAsRead');
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Object} Update result
   */
  async markAllAsRead(userId, role) {
    try {
      this.log('markAllAsRead', { userId, role });

      const userModel = role === 'buyer' ? 'Buyer' : 'Seller';

      const result = await Notification.updateMany(
        {
          userId,
          userModel,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      this.log('markAllAsRead completed', { modifiedCount: result.modifiedCount });
      return {
        success: true,
        markedCount: result.modifiedCount
      };

    } catch (error) {
      this.handleError(error, 'markAllAsRead');
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Deletion result
   */
  async deleteNotification(notificationId, userId) {
    try {
      this.log('deleteNotification', { notificationId, userId });

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error("Notification not found");
      }

      // Check ownership
      if (notification.userId.toString() !== userId) {
        throw new Error("Unauthorized access to this notification");
      }

      await Notification.findByIdAndDelete(notificationId);

      this.log('deleteNotification completed', { notificationId });
      return {
        success: true,
        message: "Notification deleted successfully"
      };

    } catch (error) {
      this.handleError(error, 'deleteNotification');
    }
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {number} Unread count
   */
  async getUnreadCount(userId, role) {
    try {
      this.log('getUnreadCount', { userId, role });

      const userModel = role === 'buyer' ? 'Buyer' : 'Seller';

      const count = await Notification.countDocuments({
        userId,
        userModel,
        isRead: false
      });

      this.log('getUnreadCount completed', { count });
      return { count };

    } catch (error) {
      this.handleError(error, 'getUnreadCount');
    }
  }

  /**
   * Get notification statistics
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Object} Notification statistics
   */
  async getNotificationStats(userId, role) {
    try {
      this.log('getNotificationStats', { userId, role });

      const userModel = role === 'buyer' ? 'Buyer' : 'Seller';

      const stats = await Notification.aggregate([
        {
          $match: {
            userId: userId,
            userModel: userModel
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
            },
            read: {
              $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] }
            },
            byType: {
              $push: {
                type: '$type',
                isRead: '$isRead'
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        unread: 0,
        read: 0,
        byType: []
      };

      // Process type statistics
      const typeStats = {};
      result.byType.forEach(item => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = { total: 0, unread: 0, read: 0 };
        }
        typeStats[item.type].total++;
        if (item.isRead) {
          typeStats[item.type].read++;
        } else {
          typeStats[item.type].unread++;
        }
      });

      result.typeStats = typeStats;
      delete result.byType;

      this.log('getNotificationStats completed', result);
      return result;

    } catch (error) {
      this.handleError(error, 'getNotificationStats');
    }
  }

  /**
   * Clean up old notifications
   * @param {number} daysOld - Days old to clean up (default 30)
   * @returns {Object} Cleanup result
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      this.log('cleanupOldNotifications', { daysOld });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      this.log('cleanupOldNotifications completed', { 
        deletedCount: result.deletedCount 
      });
      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate
      };

    } catch (error) {
      this.handleError(error, 'cleanupOldNotifications');
    }
  }
}

module.exports = new NotificationService();
