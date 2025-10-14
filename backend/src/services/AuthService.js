const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Buyer = require("../models/buyer");
const Seller = require("../models/seller");
const sendEmail = require("../utils/sendEmail");
const BaseService = require("./BaseService");
const { AppError } = require("../utils/ErrorHandler");

/**
 * Authentication Service
 * Handles user registration, login, verification, and authentication logic
 */
class AuthService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Password
   * @param {string} userData.role - User role (buyer/seller)
   * @returns {Object} Registration result
   */
  async registerUser(userData) {
    try {
      this.log('registerUser', { email: userData.email, role: userData.role });
      
      const { username, email, password, role } = userData;
      this.validateRequired(userData, ['username', 'email', 'password', 'role']);

      // Determine the model based on role
      const Model = role === "buyer" ? Buyer : role === "seller" ? Seller : null;
      if (!Model) {
        throw new AppError("Invalid role. Must be 'buyer' or 'seller'", 400);
      }

      // Check if user already exists
      const existingUser = await Model.findOne({ email });
      if (existingUser) {
        throw new AppError("Email already exists", 409);
      }

      // Generate verification token
      const verifyToken = crypto.randomBytes(32).toString("hex");

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await Model.create({
        username,
        email,
        password: hashedPassword,
        role,
        verifyToken,
        isVerified: false
      });

      // Send verification email
      await sendEmail(email, verifyToken);

      this.log('registerUser completed', { userId: newUser._id });
      return {
        success: true,
        message: "Check your email to verify your account.",
        userId: newUser._id
      };
    } catch (error) {
      this.handleError(error, 'registerUser');
    }
  }

  /**
   * Verify user email
   * @param {string} token - Verification token
   * @returns {Object} Verification result
   */
  async verifyUser(token) {
    try {
      this.log('verifyUser', { token });

      if (!token) {
        throw new AppError("Verification token is required", 400);
      }

      // Check in both Buyer and Seller models
      let user = await Buyer.findOne({ verifyToken: token });
      if (!user) {
        user = await Seller.findOne({ verifyToken: token });
      }

      if (!user) {
        throw new AppError("Invalid or expired verification token", 400);
      }

      if (user.isVerified) {
        return {
          success: true,
          message: "Account already verified",
          user: { id: user._id, email: user.email, role: user.role }
        };
      }

      // Update user verification status
      user.isVerified = true;
      user.verifyToken = undefined;
      await user.save();

      this.log('verifyUser completed', { userId: user._id });
      return {
        success: true,
        message: "Account verified successfully",
        user: { id: user._id, email: user.email, role: user.role }
      };
    } catch (error) {
      this.handleError(error, 'verifyUser');
    }
  }

  /**
   * Verify user email with welcome notifications
   * @param {string} token - Verification token
   * @returns {Object} Verification result
   */
  async verifyUserWithWelcome(token) {
    try {
      this.log('verifyUserWithWelcome', { token });

      const result = await this.verifyUser(token);
      
      if (result.success && result.user) {
        // Send welcome notification based on user role
        const NotificationService = require("./NotificationService");
        
        if (result.user.role === 'buyer') {
          await NotificationService.createNotification(
            result.user.id,
            'buyer',
            'welcome',
            'Welcome to ZamHarvest!',
            'Welcome to ZamHarvest Marketplace! Start exploring fresh agricultural products from local farmers.',
            { userType: 'buyer' }
          );
        } else if (result.user.role === 'seller') {
          await NotificationService.createNotification(
            result.user.id,
            'seller',
            'welcome',
            'Welcome to ZamHarvest!',
            'Welcome to ZamHarvest Marketplace! Start listing your agricultural products and connect with buyers.',
            { userType: 'seller' }
          );
        }
      }

      this.log('verifyUserWithWelcome completed', { userId: result.user?.id });
      return result;
    } catch (error) {
      this.handleError(error, 'verifyUserWithWelcome');
    }
  }

  /**
   * Authenticate user login
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - Email address or username
   * @param {string} credentials.password - Password
   * @returns {Object} Authentication result
   */
  async loginUser(credentials) {
    try {
      this.log('loginUser', { identifier: credentials.email });
      
      const { email, password } = credentials;
      this.validateRequired(credentials, ['email', 'password']);

      // Find user by email OR username in both models
      let user = await Buyer.findOne({ 
        $or: [
          { email: email },
          { username: email } // email parameter might contain username
        ]
      });
      let role = "buyer";
      
      if (!user) {
        user = await Seller.findOne({ 
          $or: [
            { email: email },
            { username: email } // email parameter might contain username
          ]
        });
        role = "seller";
      }

      if (!user) {
        throw new AppError("Invalid username or password", 401);
      }

      if (!user.isVerified) {
        throw new AppError("Please verify your email before logging in", 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new AppError("Invalid username or password", 401);
      }

      this.log('loginUser completed', { userId: user._id, role });
      return {
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: role
        }
      };
    } catch (error) {
      this.handleError(error, 'loginUser');
    }
  }

  /**
   * Get user by ID and role
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Object} User data
   */
  async getUserById(userId, role) {
    try {
      this.log('getUserById', { userId, role });

      const Model = role === "buyer" ? Buyer : role === "seller" ? Seller : null;
      if (!Model) {
        throw new AppError("Invalid role", 400);
      }

      const user = await Model.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      };
    } catch (error) {
      this.handleError(error, 'getUserById');
    }
  }

  /**
   * Middleware helper: Ensure user is buyer
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {boolean} True if user is buyer
   */
  async ensureBuyer(userId, role) {
    if (!userId || role !== "buyer") {
      throw new AppError("You must be logged in as a buyer to access this resource", 403);
    }
    return true;
  }

  /**
   * Middleware helper: Ensure user is seller
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {boolean} True if user is seller
   */
  async ensureSeller(userId, role) {
    if (!userId || role !== "seller") {
      throw new AppError("You must be logged in as a seller to access this resource", 403);
    }
    return true;
  }
}

module.exports = new AuthService();
