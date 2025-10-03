/**
 * Base Service Class
 * Provides common functionality for all service classes
 */
class BaseService {
  constructor() {
    this.name = this.constructor.name;
  }

  /**
   * Log service operations
   * @param {string} operation - The operation being performed
   * @param {Object} data - Optional data to log
   */
  log(operation, data = null) {
    console.log(`[${this.name}] ${operation}`, data ? JSON.stringify(data, null, 2) : '');
  }

  /**
   * Handle service errors
   * @param {Error} error - The error to handle
   * @param {string} operation - The operation that failed
   */
  handleError(error, operation) {
    console.error(`[${this.name}] Error in ${operation}:`, error);
    throw error;
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Array of required field names
   * @throws {Error} If validation fails
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}

module.exports = BaseService;
