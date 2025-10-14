/**
 * HTTP Request Logging Middleware
 * Logs all HTTP requests with response times and status codes
 */

const Logger = require('../utils/Logger');

/**
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the HTTP request
    Logger.http(req, res, responseTime);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = requestLogger;
