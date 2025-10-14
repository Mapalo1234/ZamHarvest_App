/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHandler {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Handle different types of errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  handle(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log error
    this.logError(err, req);

    // Handle specific error types
    if (err.name === 'CastError') {
      error = this.handleCastError(error);
    }
    if (err.code === 11000) {
      error = this.handleDuplicateFieldsError(error);
    }
    if (err.name === 'ValidationError') {
      error = this.handleValidationError(error);
    }
    if (err.name === 'JsonWebTokenError') {
      error = this.handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = this.handleJWTExpiredError();
    }

    this.sendErrorResponse(error, req, res);
  }

  /**
   * Handle CastError (invalid ObjectId)
   * @param {Error} err - Error object
   * @returns {AppError} Formatted error
   */
  handleCastError(err) {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
  }

  /**
   * Handle duplicate field errors
   * @param {Error} err - Error object
   * @returns {AppError} Formatted error
   */
  handleDuplicateFieldsError(err) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
  }

  /**
   * Handle validation errors
   * @param {Error} err - Error object
   * @returns {AppError} Formatted error
   */
  handleValidationError(err) {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
  }

  /**
   * Handle JWT errors
   * @returns {AppError} Formatted error
   */
  handleJWTError() {
    return new AppError('Invalid token. Please log in again!', 401);
  }

  /**
   * Handle JWT expired errors
   * @returns {AppError} Formatted error
   */
  handleJWTExpiredError() {
    return new AppError('Your token has expired! Please log in again.', 401);
  }

  /**
   * Send error response to client
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendErrorResponse(err, req, res) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        ...(this.isDevelopment && { stack: err.stack })
      });
    } else {
      // Programming or other unknown error: don't leak error details
      console.error('ERROR 💥', err);

      res.status(500).json({
        success: false,
        status: 'error',
        message: this.isDevelopment ? err.message : 'Something went wrong!',
        ...(this.isDevelopment && { stack: err.stack })
      });
    }
  }

  /**
   * Log error with context
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   */
  logError(err, req) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.session?.userId || 'anonymous',
      ...(this.isDevelopment && {
        body: req.body,
        query: req.query,
        params: req.params
      })
    };

    // Log to console in development
    if (this.isDevelopment) {
      console.error(' Error Details:', errorInfo);
    } else {
      // In production, you might want to send to external logging service
      console.error(JSON.stringify(errorInfo));
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection() {
    process.on('unhandledRejection', (err, promise) => {
      console.error(' Unhandled Promise Rejection:', err.name, err.message);
      console.error('Promise:', promise);
      
      // Close server & exit process
      process.exit(1);
    });
  }

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException() {
    process.on('uncaughtException', (err) => {
      console.error(' Uncaught Exception:', err.name, err.message);
      console.error(err.stack);
      
      // Close server & exit process
      process.exit(1);
    });
  }

  /**
   * Initialize error handling
   */
  init() {
    this.handleUnhandledRejection();
    this.handleUncaughtException();
  }
}

module.exports = {
  ErrorHandler: new ErrorHandler(),
  AppError
};
