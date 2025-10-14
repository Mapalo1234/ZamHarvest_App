const MessageService = require("../services/MessageService");
const BaseController = require("./BaseController");

/**
 * Message Controller
 * Handles HTTP requests for messaging operations
 */
class MessageController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Create or get conversation
   */
  createOrGetConversation = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    if (role !== 'buyer') {
      return this.sendError(res, 'Only buyers can initiate conversations', 403);
    }

    // Validate required fields
    const { buyerId, sellerId, productId } = req.body;
    if (!buyerId || !sellerId || !productId) {
      return this.sendError(res, 'Missing required fields: buyerId, sellerId, productId', 400);
    }

    // Ensure buyerId matches the logged-in user
    if (buyerId !== userId) {
      return this.sendError(res, 'Buyer ID must match the logged-in user', 400);
    }

    await this.handleServiceResponse(
      res,
      MessageService.createOrGetConversation(req.body, userId),
      'Conversation retrieved successfully',
      200
    );
  });

  /**
   * Send a message
   */
  sendMessage = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      MessageService.sendMessage(req.body, userId, role),
      'Message sent successfully',
      201
    );
  });

  /**
   * Get messages for a conversation
   */
  getMessages = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { conversationId } = req.params;
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      MessageService.getMessages(conversationId, userId, role),
      'Messages retrieved successfully'
    );
  });

  /**
   * Get all conversations for a user
   */
  getConversations = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      MessageService.getConversations(userId, role),
      'Conversations retrieved successfully'
    );
  });

  /**
   * Mark messages as read
   */
  markMessagesAsRead = this.asyncHandler(async (req, res) => {
    const { userId } = this.getUserSession(req);
    const { conversationId } = req.params;
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      MessageService.markMessagesAsRead(conversationId, userId),
      'Messages marked as read'
    );
  });

  /**
   * Get unread message count
   */
  getUnreadCount = this.asyncHandler(async (req, res) => {
    const { userId } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    const count = await MessageService.getUnreadCount(userId);
    
    return this.sendSuccess(res, { count }, 'Unread count retrieved successfully');
  });

  /**
   * Delete conversation
   */
  deleteConversation = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { conversationId } = req.params;
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    await this.handleServiceResponse(
      res,
      MessageService.deleteConversation(conversationId, userId, role),
      'Conversation deleted successfully'
    );
  });

  // Legacy endpoints for backward compatibility

  /**
   * Send message (legacy endpoint)
   */
  sendMessageLegacy = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    // Transform legacy request format to new format
    const { productId, sellerId, message } = req.body;
    
    if (!productId || !sellerId || !message) {
      return this.sendError(res, 'Missing required fields: productId, sellerId, message', 400);
    }

    // First create/get conversation
    try {
      const conversationResult = await MessageService.createOrGetConversation({
        buyerId: userId,
        sellerId: sellerId,
        productId: productId
      }, userId);

      // Then send message
      const messageResult = await MessageService.sendMessage({
        conversationId: conversationResult.conversation._id,
        message: message
      }, userId, role);

      return this.sendSuccess(res, messageResult, 'Message sent successfully', 201);
    } catch (error) {
      return this.sendError(res, error.message, 500, error);
    }
  });

  /**
   * Get messages for product (legacy endpoint)
   */
  getMessagesForProduct = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { productId } = req.params;
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    try {
      // Get all conversations for this user
      const conversations = await MessageService.getConversations(userId, role);
      
      // Find conversation for this product
      const conversation = conversations.find(conv => 
        conv.product._id.toString() === productId
      );

      if (!conversation) {
        return this.sendSuccess(res, [], 'No messages found for this product');
      }

      // Get messages for this conversation
      const messages = await MessageService.getMessages(conversation._id, userId, role);
      
      return this.sendSuccess(res, messages, 'Messages retrieved successfully');
    } catch (error) {
      return this.sendError(res, error.message, 500, error);
    }
  });

  /**
   * Mark messages as read for product (legacy endpoint)
   */
  markProductMessagesAsRead = this.asyncHandler(async (req, res) => {
    const { userId, role } = this.getUserSession(req);
    const { productId } = req.params;
    
    if (!userId) {
      return this.sendError(res, 'Please log in', 401);
    }

    try {
      // Get all conversations for this user
      const conversations = await MessageService.getConversations(userId, role);
      
      // Find conversation for this product
      const conversation = conversations.find(conv => 
        conv.product._id.toString() === productId
      );

      if (!conversation) {
        return this.sendSuccess(res, { markedCount: 0 }, 'No conversation found for this product');
      }

      // Mark messages as read
      const result = await MessageService.markMessagesAsRead(conversation._id, userId);
      
      return this.sendSuccess(res, result, 'Messages marked as read');
    } catch (error) {
      return this.sendError(res, error.message, 500, error);
    }
  });
}

module.exports = new MessageController();
