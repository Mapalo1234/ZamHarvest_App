const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Product = require("../models/Product");
const Buyer = require("../models/buyer");
const Seller = require("../models/seller");
const NotificationService = require("./NotificationService");
const BaseService = require("./BaseService");

/**
 * Message Service
 * Handles messaging, conversations, and communication business logic
 */
class MessageService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Create or get conversation
   * @param {Object} conversationData - Conversation data
   * @param {string} conversationData.buyerId - Buyer ID
   * @param {string} conversationData.sellerId - Seller ID
   * @param {string} conversationData.productId - Product ID
   * @param {string} currentUserId - Current user ID (for security)
   * @returns {Object} Conversation data
   */
  async createOrGetConversation(conversationData, currentUserId) {
    try {
      this.log('createOrGetConversation', { ...conversationData, currentUserId });

      const { buyerId, sellerId, productId } = conversationData;
      this.validateRequired(conversationData, ['buyerId', 'sellerId', 'productId']);

      // Security check: ensure current user is the buyer
      if (currentUserId !== buyerId) {
        throw new Error("Unauthorized: You can only create conversations as yourself");
      }

      // Verify the product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Verify the seller exists
      const seller = await Seller.findById(sellerId);
      if (!seller) {
        throw new Error("Seller not found");
      }

      // Verify the buyer exists
      const buyer = await Buyer.findById(buyerId);
      if (!buyer) {
        throw new Error("Buyer not found");
      }

      // Check if conversation exists
      let conversation = await Conversation.findOne({
        buyerId: currentUserId,
        sellerId: sellerId,
        product: productId,
        isActive: { $ne: false }
      }).populate('buyerId', 'username email')
        .populate('sellerId', 'username email')
        .populate('product', 'name price image');

      let isNewConversation = false;

      if (!conversation) {
        try {
          // Create new conversation
          conversation = new Conversation({
            buyerId: currentUserId,
            sellerId: sellerId,
            product: productId,
            lastMessageAt: new Date(),
            isActive: true
          });

          await conversation.save();
          isNewConversation = true;

          // Populate the new conversation
          await conversation.populate('buyerId', 'username email');
          await conversation.populate('sellerId', 'username email');
          await conversation.populate('product', 'name price image');
        } catch (error) {
          // Handle duplicate key error (conversation already exists)
          if (error.code === 11000) {
            this.log('Conversation already exists, fetching existing one');
            conversation = await Conversation.findOne({
              buyerId: currentUserId,
              sellerId: sellerId,
              product: productId,
              isActive: { $ne: false }
            }).populate('buyerId', 'username email')
              .populate('sellerId', 'username email')
              .populate('product', 'name price image');
            
            isNewConversation = false;
          } else {
            throw error;
          }
        }
      }

      this.log('createOrGetConversation completed', { 
        conversationId: conversation._id, 
        isNewConversation 
      });

      return {
        success: true,
        conversation: conversation,
        isNewConversation: isNewConversation
      };
    } catch (error) {
      this.handleError(error, 'createOrGetConversation');
    }
  }

  /**
   * Send a message
   * @param {Object} messageData - Message data
   * @param {string} messageData.conversationId - Conversation ID
   * @param {string} messageData.message - Message content
   * @param {string} senderId - Sender ID
   * @param {string} senderType - Sender type (buyer/seller)
   * @returns {Object} Sent message
   */
  async sendMessage(messageData, senderId, senderType) {
    try {
      this.log('sendMessage', { ...messageData, senderId, senderType });

      const { conversationId, message } = messageData;
      this.validateRequired(messageData, ['conversationId', 'message']);

      if (!message.trim()) {
        throw new Error("Message content cannot be empty");
      }

      // Get conversation and verify access
      const conversation = await Conversation.findById(conversationId)
        .populate('buyerId', 'username')
        .populate('sellerId', 'username')
        .populate('product', 'name');

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Verify sender has access to this conversation
      const hasAccess = (senderType === 'buyer' && conversation.buyerId._id.toString() === senderId) ||
                       (senderType === 'seller' && conversation.sellerId._id.toString() === senderId);

      if (!hasAccess) {
        throw new Error("Unauthorized access to this conversation");
      }

      // Determine receiver
      const receiverId = senderType === 'buyer' ? conversation.sellerId._id : conversation.buyerId._id;
      const receiverType = senderType === 'buyer' ? 'seller' : 'buyer';

      // Create message
      const newMessage = new Message({
        conversationId: conversationId,
        senderId: senderId,
        receiverId: receiverId,
        senderType: senderType,
        receiverType: receiverType,
        senderModel: senderType === 'buyer' ? 'Buyer' : 'Seller',
        receiverModel: receiverType === 'buyer' ? 'Buyer' : 'Seller',
        message: message.trim(),
        productId: conversation.product._id,
        isRead: false
      });

      await newMessage.save();

      // Update conversation's last message time
      conversation.lastMessageAt = new Date();
      conversation.lastMessageTime = new Date();
      conversation.lastMessage = message.trim();
      await conversation.save();

      // Populate sender information
      await newMessage.populate('senderId', 'username');

      // Send notification to receiver
      const receiverName = senderType === 'buyer' ? 
        conversation.sellerId.username : 
        conversation.buyerId.username;

      await NotificationService.createNotification(
        receiverId,
        receiverType,
        'message_received',
        'New Message',
        `You have a new message about ${conversation.product.name}`,
        {
          conversationId: conversationId,
          productId: conversation.product._id,
          messageId: newMessage._id,
          senderId: newMessage.senderId._id,
          senderName: newMessage.senderId.username
        }
      );

      this.log('sendMessage completed', { messageId: newMessage._id });
      return {
        success: true,
        message: newMessage
      };
    } catch (error) {
      this.handleError(error, 'sendMessage');
    }
  }

  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} userType - User type (buyer/seller)
   * @returns {Array} Array of messages
   */
  async getMessages(conversationId, userId, userType) {
    try {
      this.log('getMessages', { conversationId, userId, userType });

      // Verify conversation access
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const hasAccess = (userType === 'buyer' && conversation.buyerId.toString() === userId) ||
                       (userType === 'seller' && conversation.sellerId.toString() === userId);

      if (!hasAccess) {
        throw new Error("Unauthorized access to this conversation");
      }

      // Get messages
      const messages = await Message.find({ conversationId })
        .populate('senderId', 'username')
        .sort({ createdAt: 1 });

      this.log('getMessages completed', { count: messages.length });
      return messages;
    } catch (error) {
      this.handleError(error, 'getMessages');
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @param {string} userType - User type (buyer/seller)
   * @returns {Array} Array of conversations
   */
  async getConversations(userId, userType) {
    try {
      this.log('getConversations', { userId, userType });

      const filter = userType === 'buyer' ? 
        { buyerId: userId, isActive: { $ne: false } } : 
        { sellerId: userId, isActive: { $ne: false } };

      const conversations = await Conversation.find(filter)
        .populate('buyerId', 'username email')
        .populate('sellerId', 'username email')
        .populate('product', 'name price image')
        .sort({ lastMessageAt: -1 });

      // Get unread message counts for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
          const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            receiverId: userId,
            isRead: false
          });

          // Get last message
          const lastMessage = await Message.findOne({
            conversationId: conversation._id
          }).sort({ createdAt: -1 });

          return {
            ...conversation.toObject(),
            unreadCount,
            lastMessage: lastMessage ? {
              message: lastMessage.message,
              createdAt: lastMessage.createdAt,
              senderType: lastMessage.senderType
            } : null
          };
        })
      );

      this.log('getConversations completed', { count: conversationsWithUnread.length });
      return conversationsWithUnread;
    } catch (error) {
      this.handleError(error, 'getConversations');
    }
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (receiver)
   * @returns {Object} Update result
   */
  async markMessagesAsRead(conversationId, userId) {
    try {
      this.log('markMessagesAsRead', { conversationId, userId });

      // Verify conversation access
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const hasAccess = conversation.buyerId.toString() === userId ||
                       conversation.sellerId.toString() === userId;

      if (!hasAccess) {
        throw new Error("Unauthorized access to this conversation");
      }

      // Mark messages as read
      const result = await Message.updateMany(
        {
          conversationId: conversationId,
          receiverId: userId,
          isRead: false
        },
        { isRead: true }
      );

      this.log('markMessagesAsRead completed', { modifiedCount: result.modifiedCount });
      return {
        success: true,
        markedCount: result.modifiedCount
      };
    } catch (error) {
      this.handleError(error, 'markMessagesAsRead');
    }
  }

  /**
   * Get unread message count for a user
   * @param {string} userId - User ID
   * @returns {number} Unread message count
   */
  async getUnreadCount(userId) {
    try {
      this.log('getUnreadCount', { userId });

      const count = await Message.countDocuments({
        receiverId: userId,
        isRead: false
      });

      this.log('getUnreadCount completed', { count });
      return count;
    } catch (error) {
      this.handleError(error, 'getUnreadCount');
    }
  }

  /**
   * Delete a conversation (soft delete)
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} userType - User type
   * @returns {Object} Deletion result
   */
  async deleteConversation(conversationId, userId, userType) {
    try {
      this.log('deleteConversation', { conversationId, userId, userType });

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const hasAccess = (userType === 'buyer' && conversation.buyerId.toString() === userId) ||
                       (userType === 'seller' && conversation.sellerId.toString() === userId);

      if (!hasAccess) {
        throw new Error("Unauthorized access to this conversation");
      }

      // Soft delete by marking as inactive
      conversation.isActive = false;
      await conversation.save();

      this.log('deleteConversation completed', { conversationId });
      return {
        success: true,
        message: "Conversation deleted successfully"
      };
    } catch (error) {
      this.handleError(error, 'deleteConversation');
    }
  }
}

module.exports = new MessageService();
