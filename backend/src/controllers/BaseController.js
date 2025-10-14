const { AppError } = require('../utils/ErrorHandler');
const Logger = require('../utils/Logger');

/**
 * Base Controller Class
 * Provides common functionality for all controller classes
 */
class BaseController {
  constructor() {
    this.name = this.constructor.name;
    this.logger = Logger;
  }

  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      ...(data && { data })
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} error - Additional error details
   */
  sendError(res, message = 'Internal Server Error', statusCode = 500, error = null) {
    this.logger.error(`[${this.name}] Error: ${message}`, error, {
      controller: this.name,
      statusCode,
      message
    });
    
    const response = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && error && { error: error.toString() })
    };
    
    return res.status(statusCode).json(response);
  }

  /**
   * Handle async controller methods
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Express middleware function
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Validate request data
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Required field names
   * @throws {Error} If validation fails
   */
  validateRequest(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Get user session data
   * @param {Object} req - Express request object
   * @returns {Object} User session data
   */
  getUserSession(req) {
    return {
      userId: req.session.userId,
      role: req.session.role,
      username: req.session.username
    };
  }

  /**
   * Check if user is authenticated
   * @param {Object} req - Express request object
   * @returns {boolean} Authentication status
   */
  isAuthenticated(req) {
    return !!(req.session && req.session.userId);
  }

  /**
   * Handle service responses
   * @param {Object} res - Express response object
   * @param {Promise} servicePromise - Service method promise
   * @param {string} successMessage - Success message
   * @param {number} successStatusCode - Success status code
   */
  async handleServiceResponse(res, servicePromise, successMessage = 'Success', successStatusCode = 200) {
    try {
      const result = await servicePromise;
      
      if (result && result.success === false) {
        this.logger.warn('Service returned error', {
          controller: this.name,
          message: result.message,
          statusCode: 400
        });
        return this.sendError(res, result.message || 'Service error', 400);
      }
      
      this.logger.info('Service operation successful', {
        controller: this.name,
        message: successMessage,
        statusCode: successStatusCode
      });
      
      return this.sendSuccess(res, result, successMessage, successStatusCode);
    } catch (error) {
      this.logger.error('Service operation failed', error, {
        controller: this.name,
        operation: 'handleServiceResponse'
      });

      // Handle specific error types
      if (error.message.includes('not found')) {
        return this.sendError(res, error.message, 404);
      }
      if (error.message.includes('Unauthorized') || error.message.includes('Access denied')) {
        return this.sendError(res, error.message, 403);
      }
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return this.sendError(res, error.message, 400);
      }
      
      return this.sendError(res, error.message, 500, error);
    }
  }

  /**
   * Handle errors with logging
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   */
  handleError(error, context) {
    this.logger.error(`Error in ${context}`, error, {
      controller: this.name,
      context
    });
    throw error;
  }

  /**
   * Log messages with context
   * @param {string} method - Method name
   * @param {*} data - Data to log
   */
  log(method, data) {
    this.logger.info(`${method}`, {
      controller: this.name,
      method,
      ...data
    });
  }
}

module.exports = BaseController;
