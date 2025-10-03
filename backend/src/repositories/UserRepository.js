const Buyer = require("../models/buyer");
const Seller = require("../models/seller");
const BaseRepository = require("./BaseRepository");

/**
 * User Repository
 * Handles user-specific database operations for both buyers and sellers
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(null); // No single model for this repository
  }

  /**
   * Find user by email in both buyer and seller collections
   * @param {string} email - User email
   * @returns {Object} User object with role
   */
  async findByEmail(email) {
    try {
      let user = await Buyer.findOne({ email });
      if (user) {
        return { user, role: 'buyer' };
      }

      user = await Seller.findOne({ email });
      if (user) {
        return { user, role: 'seller' };
      }

      return null;
    } catch (error) {
      console.error('[UserRepository] Error in findByEmail:', error);
      throw error;
    }
  }

  /**
   * Find user by email OR username in both collections
   * @param {string} identifier - Email or username
   * @returns {Object} User object with role
   */
  async findByEmailOrUsername(identifier) {
    try {
      let user = await Buyer.findOne({ 
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      });
      if (user) {
        return { user, role: 'buyer' };
      }

      user = await Seller.findOne({ 
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      });
      if (user) {
        return { user, role: 'seller' };
      }

      return null;
    } catch (error) {
      console.error('[UserRepository] Error in findByEmailOrUsername:', error);
      throw error;
    }
  }

  /**
   * Find user by username in both collections
   * @param {string} username - Username
   * @returns {Object} User object with role
   */
  async findByUsername(username) {
    try {
      let user = await Buyer.findOne({ username });
      if (user) {
        return { user, role: 'buyer' };
      }

      user = await Seller.findOne({ username });
      if (user) {
        return { user, role: 'seller' };
      }

      return null;
    } catch (error) {
      console.error('[UserRepository] Error in findByUsername:', error);
      throw error;
    }
  }

  /**
   * Find user by verification token
   * @param {string} token - Verification token
   * @returns {Object} User object with role
   */
  async findByVerifyToken(token) {
    try {
      let user = await Buyer.findOne({ verifyToken: token });
      if (user) {
        return { user, role: 'buyer' };
      }

      user = await Seller.findOne({ verifyToken: token });
      if (user) {
        return { user, role: 'seller' };
      }

      return null;
    } catch (error) {
      console.error('[UserRepository] Error in findByVerifyToken:', error);
      throw error;
    }
  }

  /**
   * Find user by ID and role
   * @param {string} userId - User ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Object} User object
   */
  async findByIdAndRole(userId, role) {
    try {
      const Model = role === 'buyer' ? Buyer : Seller;
      return await Model.findById(userId);
    } catch (error) {
      console.error('[UserRepository] Error in findByIdAndRole:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} role - User role (buyer/seller)
   * @returns {Object} Created user
   */
  async createUser(userData, role) {
    try {
      const Model = role === 'buyer' ? Buyer : Seller;
      const user = new Model({ ...userData, role });
      return await user.save();
    } catch (error) {
      console.error('[UserRepository] Error in createUser:', error);
      throw error;
    }
  }

  /**
   * Update user by ID and role
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user
   */
  async updateByIdAndRole(userId, role, updateData) {
    try {
      const Model = role === 'buyer' ? Buyer : Seller;
      return await Model.findByIdAndUpdate(userId, updateData, { new: true });
    } catch (error) {
      console.error('[UserRepository] Error in updateByIdAndRole:', error);
      throw error;
    }
  }

  /**
   * Check if email exists in either collection
   * @param {string} email - Email to check
   * @returns {boolean} Existence status
   */
  async emailExists(email) {
    try {
      const buyerExists = await Buyer.countDocuments({ email }) > 0;
      if (buyerExists) return true;

      const sellerExists = await Seller.countDocuments({ email }) > 0;
      return sellerExists;
    } catch (error) {
      console.error('[UserRepository] Error in emailExists:', error);
      throw error;
    }
  }

  /**
   * Check if username exists in either collection
   * @param {string} username - Username to check
   * @returns {boolean} Existence status
   */
  async usernameExists(username) {
    try {
      const buyerExists = await Buyer.countDocuments({ username }) > 0;
      if (buyerExists) return true;

      const sellerExists = await Seller.countDocuments({ username }) > 0;
      return sellerExists;
    } catch (error) {
      console.error('[UserRepository] Error in usernameExists:', error);
      throw error;
    }
  }

  /**
   * Get all buyers
   * @param {Object} options - Query options
   * @returns {Array} Array of buyers
   */
  async getAllBuyers(options = {}) {
    try {
      let query = Buyer.find({});
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      return await query.exec();
    } catch (error) {
      console.error('[UserRepository] Error in getAllBuyers:', error);
      throw error;
    }
  }

  /**
   * Get all sellers
   * @param {Object} options - Query options
   * @returns {Array} Array of sellers
   */
  async getAllSellers(options = {}) {
    try {
      let query = Seller.find({});
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      return await query.exec();
    } catch (error) {
      console.error('[UserRepository] Error in getAllSellers:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository();
