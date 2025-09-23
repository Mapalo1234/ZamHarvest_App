const express = require("express");
const Notification = require("../models/notification");
const Order = require("../models/order");
const Request = require("../models/request");

const router = express.Router();

// Create a new notification (for testing)
router.post("/notifications", async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { type, title, message, data = {} } = req.body;
    const userId = req.session.userId;
    const userModel = req.session.role === 'buyer' ? 'Buyer' : 'Seller';

    const notification = new Notification({
      userId,
      userModel,
      type,
      title,
      message,
      data
    });

    await notification.save();
    res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all notifications for the current user
router.get("/notifications", async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.session.userId;
    const userModel = req.session.role === 'buyer' ? 'Buyer' : 'Seller';

    const notifications = await Notification.find({ 
      userId: userId,
      userModel: userModel 
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 notifications

    const unreadCount = await Notification.countDocuments({ 
      userId: userId,
      userModel: userModel,
      isRead: false 
    });

    res.json({ 
      notifications, 
      unreadCount,
      total: notifications.length 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Mark notification as read
router.put("/notifications/:id/read", async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Mark all notifications as read
router.put("/notifications/read-all", async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.session.userId;
    const userModel = req.session.role === 'buyer' ? 'Buyer' : 'Seller';

    await Notification.updateMany(
      { 
        userId: userId,
        userModel: userModel,
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete notification
router.delete("/notifications/:id", async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get unread count only
router.get("/notifications/unread-count", async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.session.userId;
    const userModel = req.session.role === 'buyer' ? 'Buyer' : 'Seller';

    const unreadCount = await Notification.countDocuments({ 
      userId: userId,
      userModel: userModel,
      isRead: false 
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
