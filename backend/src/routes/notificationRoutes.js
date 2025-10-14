const express = require("express");
const NotificationController = require("../controllers/NotificationController");

const router = express.Router();

// Routes using controllers
router.post("/notifications", NotificationController.createNotification);
router.get("/notifications", NotificationController.getNotifications);
router.put("/notifications/:notificationId/read", NotificationController.markAsRead);
router.put("/notifications/mark-all-read", NotificationController.markAllAsRead);
router.delete("/notifications/:notificationId", NotificationController.deleteNotification);
router.get("/notifications/unread-count", NotificationController.getUnreadCount);
router.get("/notifications/stats", NotificationController.getNotificationStats);

module.exports = router;