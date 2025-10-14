const { AppError } = require('../utils/ErrorHandler');
const Logger = require('../utils/Logger');

/**
 * Base Service Class
 * Provides common functionality for all service classes
 */
class BaseService {
  constructor() {
    this.name = this.constructor.name;
    this.logger = Logger;
  }

  /**
   * Log service operations
   * @param {string} operation - The operation being performed
   * @param {Object} data - Optional data to log
   */
  log(operation, data = null) {
    this.logger.info(`${operation}`, {
      service: this.name,
      operation,
      ...data
    });
  }

  /**
   * Handle service errors
   * @param {Error} error - The error to handle
   * @param {string} operation - The operation that failed
   */
  handleError(error, operation) {
    this.logger.error(`Error in ${operation}`, error, {
      service: this.name,
      operation
    });
    throw error;
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Array of required field names
   * @throws {AppError} If validation fails
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      const error = new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
      this.logger.warn('Validation failed - missing required fields', {
        service: this.name,
        missingFields: missing,
        providedFields: Object.keys(data)
      });
      throw error;
    }
  }

  /**
   * Create a standardized service response
   * @param {boolean} success - Whether the operation was successful
   * @param {string} message - Response message
   * @param {*} data - Response data
   * @returns {Object} Standardized response
   */
  createResponse(success, message, data = null) {
    return {
      success,
      message,
      ...(data && { data })
    };
  }

  /**
   * Handle database operations with logging
   * @param {string} operation - Database operation name
   * @param {Function} dbOperation - Database operation function
   * @param {Object} meta - Additional metadata
   * @returns {*} Database operation result
   */
  async handleDatabaseOperation(operation, dbOperation, meta = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.database(operation, meta.collection || 'unknown', meta);
      const result = await dbOperation();
      
      const duration = Date.now() - startTime;
      this.logger.performance(`Database ${operation}`, duration, meta);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Database ${operation} failed`, error, {
        service: this.name,
        operation,
        duration: `${duration}ms`,
        ...meta
      });
      throw error;
    }
  }
}

module.exports = BaseService;
