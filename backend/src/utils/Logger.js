/**
 * Structured Logging System
 * Provides consistent logging across the application
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logDir = path.join(__dirname, '../../logs');
    
    // Create logs directory if it doesn't exist
    this.ensureLogDirectory();
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get log file path for today
   * @param {string} level - Log level (error, info, warn, debug)
   * @returns {string} Log file path
   */
  getLogFilePath(level) {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level}-${today}.log`);
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Formatted log entry
   */
  formatLog(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...meta,
      pid: process.pid,
      hostname: require('os').hostname()
    };
  }

  /**
   * Write log to file
   * @param {string} level - Log level
   * @param {Object} logEntry - Formatted log entry
   */
  writeToFile(level, logEntry) {
    const logFile = this.getLogFilePath(level);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    const logEntry = this.formatLog('info', message, meta);
    
    if (this.isDevelopment) {
      console.log(`ℹ [INFO] ${message}`, meta);
    }
    
    this.writeToFile('info', logEntry);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Error|Object} error - Error object or metadata
   * @param {Object} meta - Additional metadata
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error.statusCode && { statusCode: error.statusCode })
        }
      })
    };

    const logEntry = this.formatLog('error', message, errorMeta);
    
    if (this.isDevelopment) {
      console.error(` [ERROR] ${message}`, errorMeta);
    }
    
    this.writeToFile('error', logEntry);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    const logEntry = this.formatLog('warn', message, meta);
    
    if (this.isDevelopment) {
      console.warn(`⚠️  [WARN] ${message}`, meta);
    }
    
    this.writeToFile('warn', logEntry);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    const logEntry = this.formatLog('debug', message, meta);
    
    if (this.isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, meta);
    }
    
    this.writeToFile('debug', logEntry);
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  http(req, res, responseTime) {
    const logEntry = this.formatLog('info', 'HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.session?.userId || 'anonymous'
    });

    if (this.isDevelopment) {
      const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
      console.log(`${statusColor} ${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`);
    }

    this.writeToFile('info', logEntry);
  }

  /**
   * Log database operation
   * @param {string} operation - Database operation (create, read, update, delete)
   * @param {string} collection - Collection name
   * @param {Object} meta - Additional metadata
   */
  database(operation, collection, meta = {}) {
    const message = `Database ${operation} operation on ${collection}`;
    const logEntry = this.formatLog('info', message, {
      operation,
      collection,
      ...meta
    });

    if (this.isDevelopment) {
      console.log(`🗄️  [DB] ${message}`, meta);
    }

    this.writeToFile('info', logEntry);
  }

  /**
   * Log authentication event
   * @param {string} event - Auth event (login, logout, register, etc.)
   * @param {string} userId - User ID
   * @param {Object} meta - Additional metadata
   */
  auth(event, userId, meta = {}) {
    const message = `Authentication ${event}`;
    const logEntry = this.formatLog('info', message, {
      event,
      userId,
      ...meta
    });

    if (this.isDevelopment) {
      console.log(`🔐 [AUTH] ${message}`, { userId, ...meta });
    }

    this.writeToFile('info', logEntry);
  }

  /**
   * Log business logic event
   * @param {string} event - Business event
   * @param {string} entity - Entity type (product, order, etc.)
   * @param {string} entityId - Entity ID
   * @param {Object} meta - Additional metadata
   */
  business(event, entity, entityId, meta = {}) {
    const message = `Business ${event} for ${entity}`;
    const logEntry = this.formatLog('info', message, {
      event,
      entity,
      entityId,
      ...meta
    });

    if (this.isDevelopment) {
      console.log(`💼 [BUSINESS] ${message}`, { entityId, ...meta });
    }

    this.writeToFile('info', logEntry);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in ms
   * @param {Object} meta - Additional metadata
   */
  performance(operation, duration, meta = {}) {
    const message = `Performance: ${operation}`;
    const logEntry = this.formatLog('info', message, {
      operation,
      duration: `${duration}ms`,
      ...meta
    });

    if (this.isDevelopment) {
      console.log(`⚡ [PERF] ${message} - ${duration}ms`, meta);
    }

    this.writeToFile('info', logEntry);
  }

  /**
   * Clean old log files (keep last 30 days)
   */
  cleanOldLogs() {
    const files = fs.readdirSync(this.logDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    files.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        this.info('Cleaned old log file', { file });
      }
    });
  }
}

module.exports = new Logger();
