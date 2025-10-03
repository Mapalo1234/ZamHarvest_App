const express = require("express");
const MessageController = require("../controllers/MessageController");

const router = express.Router();

// Legacy endpoints for backward compatibility
router.post("/send-message", MessageController.sendMessageLegacy);
router.get("/messages/:productId", MessageController.getMessagesForProduct);
router.put("/mark-read/:productId", MessageController.markProductMessagesAsRead);

// Modern API endpoints
router.post("/conversations", MessageController.createOrGetConversation);
router.post("/messages", MessageController.sendMessage);
router.get("/conversations", MessageController.getConversations);
router.get("/conversations/:conversationId/messages", MessageController.getMessages);
router.put("/conversations/:conversationId/read", MessageController.markMessagesAsRead);
router.delete("/conversations/:conversationId", MessageController.deleteConversation);
router.get("/unread-count", MessageController.getUnreadCount);

module.exports = router;
