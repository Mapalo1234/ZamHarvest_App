/**
 * Validation utilities for input sanitization and validation
 */

const validator = require('validator');
const mongoose = require('mongoose');

class ValidationUtils {
  /**
   * Sanitize string input
   * @param {string} input - Input string
   * @param {number} maxLength - Maximum length
   * @returns {string} Sanitized string
   */
  static sanitizeString(input, maxLength = 255) {
    if (typeof input !== 'string') return '';
    return validator.escape(input.trim().substring(0, maxLength));
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} Is valid email
   */
  static isValidEmail(email) {
    return validator.isEmail(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password
   * @returns {Object} Validation result
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };

    if (!password || password.length < 6) {
      result.isValid = false;
      result.errors.push('Password must be at least 6 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
    }

    return result;
  }

  /**
   * Validate ObjectId
   * @param {string} id - ObjectId string
   * @returns {boolean} Is valid ObjectId
   */
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Validate price
   * @param {number} price - Price value
   * @returns {boolean} Is valid price
   */
  static isValidPrice(price) {
    return typeof price === 'number' && price >= 0 && !isNaN(price);
  }

  /**
   * Validate quantity
   * @param {number} quantity - Quantity value
   * @returns {boolean} Is valid quantity
   */
  static isValidQuantity(quantity) {
    return typeof quantity === 'number' && quantity > 0 && Number.isInteger(quantity);
  }

  /**
   * Validate rating
   * @param {number} rating - Rating value
   * @returns {boolean} Is valid rating
   */
  static isValidRating(rating) {
    return typeof rating === 'number' && rating >= 1 && rating <= 5 && Number.isInteger(rating);
  }

  /**
   * Sanitize HTML content
   * @param {string} html - HTML content
   * @returns {string} Sanitized HTML
   */
  static sanitizeHtml(html) {
    if (typeof html !== 'string') return '';
    return validator.escape(html);
  }

  /**
   * Validate date
   * @param {string|Date} date - Date value
   * @param {boolean} allowFuture - Allow future dates
   * @returns {Object} Validation result
   */
  static validateDate(date, allowFuture = true) {
    const result = {
      isValid: true,
      errors: [],
      parsedDate: null
    };

    if (!date) {
      result.isValid = false;
      result.errors.push('Date is required');
      return result;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      result.isValid = false;
      result.errors.push('Invalid date format');
      return result;
    }

    result.parsedDate = parsedDate;

    if (!allowFuture && parsedDate > new Date()) {
      result.isValid = false;
      result.errors.push('Date cannot be in the future');
    }

    return result;
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number
   * @returns {boolean} Is valid phone
   */
  static isValidPhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate file upload
   * @param {Object} file - File object
   * @param {Array} allowedTypes - Allowed MIME types
   * @param {number} maxSize - Maximum size in bytes
   * @returns {Object} Validation result
   */
  static validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) {
    const result = {
      isValid: true,
      errors: []
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('File is required');
      return result;
    }

    if (!allowedTypes.includes(file.mimetype)) {
      result.isValid = false;
      result.errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    return result;
  }
}

module.exports = ValidationUtils;
