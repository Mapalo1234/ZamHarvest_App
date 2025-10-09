# Error Handling & Logging System Guide

## 🎯 Overview

This guide documents the comprehensive error handling and logging system implemented in the ZamHarvest marketplace application. The system provides centralized error management, structured logging, and consistent error responses across the entire application.

## 🏗️ Architecture

### Components

1. **ErrorHandler** (`src/utils/ErrorHandler.js`) - Centralized error handling
2. **Logger** (`src/utils/Logger.js`) - Structured logging system
3. **AppError** - Custom error class for operational errors
4. **Request Logger** (`src/middleware/requestLogger.js`) - HTTP request logging
5. **Updated Base Classes** - Enhanced BaseController and BaseService

## 📁 File Structure

```
backend/
├── src/
│   ├── utils/
│   │   ├── ErrorHandler.js          # Centralized error handling
│   │   └── Logger.js                # Structured logging system
│   ├── middleware/
│   │   └── requestLogger.js         # HTTP request logging
│   ├── controllers/
│   │   └── BaseController.js        # Updated with error handling
│   └── services/
│       └── BaseService.js           # Updated with error handling
├── logs/                            # Generated log files
│   ├── info-YYYY-MM-DD.log
│   ├── error-YYYY-MM-DD.log
│   ├── warn-YYYY-MM-DD.log
│   └── debug-YYYY-MM-DD.log
└── test-error-handling.js           # Test script
```

## 🔧 Error Handling System

### AppError Class

Custom error class for operational errors with proper HTTP status codes:

```javascript
const { AppError } = require('./utils/ErrorHandler');

// Create operational error
throw new AppError('User not found', 404);

// Properties
error.message        // Error message
error.statusCode     // HTTP status code
error.isOperational  // true for operational errors
error.status         // 'fail' or 'error'
error.timestamp      // ISO timestamp
```

### Error Types Handled

1. **CastError** - Invalid ObjectId
2. **DuplicateFieldsError** - Duplicate field values
3. **ValidationError** - Mongoose validation errors
4. **JsonWebTokenError** - Invalid JWT tokens
5. **TokenExpiredError** - Expired JWT tokens
6. **Custom AppError** - Application-specific errors

### Global Error Handler

The global error handler automatically:
- Logs all errors with context
- Sends appropriate HTTP responses
- Handles operational vs programming errors
- Provides development vs production error details

## 📊 Logging System

### Logger Features

- **Structured JSON logging** for easy parsing
- **Multiple log levels**: info, error, warn, debug
- **Automatic file rotation** by date
- **Contextual logging** with metadata
- **Performance tracking** for database operations
- **HTTP request logging** with response times

### Log Levels

```javascript
const Logger = require('./utils/Logger');

// Info logging
Logger.info('Operation completed', { userId: '123', operation: 'create' });

// Error logging
Logger.error('Operation failed', error, { context: 'user creation' });

// Warning logging
Logger.warn('Deprecated API used', { endpoint: '/old-api' });

// Debug logging
Logger.debug('Debug information', { data: someData });
```

### Specialized Logging Methods

```javascript
// HTTP request logging
Logger.http(req, res, responseTime);

// Database operation logging
Logger.database('create', 'users', { userId: '123' });

// Authentication logging
Logger.auth('login', 'user123', { ip: '127.0.0.1' });

// Business logic logging
Logger.business('create', 'product', 'prod123', { name: 'Apple' });

// Performance logging
Logger.performance('Database query', 150, { operation: 'find' });
```

## 🚀 Usage Examples

### In Controllers

```javascript
const BaseController = require('./BaseController');
const { AppError } = require('../utils/ErrorHandler');

class ProductController extends BaseController {
  async getProduct(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new AppError('Product ID is required', 400);
      }
      
      const product = await ProductService.getProductById(id);
      return this.sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      // Error is automatically handled by BaseController
      throw error;
    }
  }
}
```

### In Services

```javascript
const BaseService = require('./BaseService');
const { AppError } = require('../utils/ErrorHandler');

class ProductService extends BaseService {
  async createProduct(productData, sellerId) {
    try {
      this.log('createProduct', { sellerId, productName: productData.name });
      
      // Validate required fields
      this.validateRequired(productData, ['name', 'price', 'category']);
      
      // Business logic
      const product = await Product.create(productData);
      
      this.log('createProduct completed', { productId: product._id });
      return product;
    } catch (error) {
      this.handleError(error, 'createProduct');
    }
  }
}
```

### Custom Error Handling

```javascript
// Create custom operational error
throw new AppError('Insufficient stock', 400);

// Create custom error with additional context
const error = new AppError('Payment failed', 402);
error.paymentId = paymentId;
error.amount = amount;
throw error;
```

## 📈 Log File Management

### Log Files

- **info-YYYY-MM-DD.log** - General information logs
- **error-YYYY-MM-DD.log** - Error logs with stack traces
- **warn-YYYY-MM-DD.log** - Warning logs
- **debug-YYYY-MM-DD.log** - Debug information

### Log Rotation

- Logs are automatically rotated daily
- Old logs (30+ days) can be cleaned up using `Logger.cleanOldLogs()`
- Log files are stored in JSON format for easy parsing

### Log Format

```json
{
  "timestamp": "2025-10-09T20:13:58.723Z",
  "level": "INFO",
  "message": "Operation completed",
  "userId": "123",
  "operation": "create",
  "pid": 3992,
  "hostname": "DESKTOP-2G260L5"
}
```

## 🧪 Testing

### Test Script

Run the test script to verify the error handling system:

```bash
cd backend
node test-error-handling.js
```

### Test Coverage

The test script covers:
- Basic logging functionality
- Error logging with stack traces
- AppError creation and properties
- Database operation logging
- Authentication logging
- Business logic logging
- HTTP request logging

## 🔍 Monitoring & Debugging

### Development Mode

In development mode, logs are displayed in the console with emojis and colors:
- ℹ️ INFO messages
- 🚨 ERROR messages
- ⚠️ WARNING messages
- 🐛 DEBUG messages

### Production Mode

In production mode:
- Logs are written to files only
- Sensitive information is filtered
- Error details are limited for security

### Real-time Monitoring

```bash
# View all logs in real-time
tail -f logs/*.log

# View only error logs
tail -f logs/error-*.log

# View only info logs
tail -f logs/info-*.log
```

## 🛠️ Configuration

### Environment Variables

```env
NODE_ENV=development  # or production
LOG_LEVEL=info        # info, error, warn, debug
LOG_DIR=./logs        # Log directory path
```

### Customization

You can customize the logging system by:
- Modifying log levels in `Logger.js`
- Adding custom log methods
- Changing log file rotation frequency
- Implementing external log shipping

## 📋 Best Practices

### Error Handling

1. **Use AppError for operational errors** that should be sent to clients
2. **Use regular Error for programming errors** that should be logged internally
3. **Always provide meaningful error messages**
4. **Include relevant context in error logs**
5. **Handle errors at the appropriate level** (service vs controller)

### Logging

1. **Log at appropriate levels** (info for normal operations, error for failures)
2. **Include relevant metadata** in log entries
3. **Use structured logging** for easy parsing
4. **Avoid logging sensitive information** (passwords, tokens)
5. **Log performance metrics** for optimization

### Monitoring

1. **Set up log monitoring** in production
2. **Create alerts** for error patterns
3. **Monitor performance metrics** regularly
4. **Review logs** for security issues
5. **Implement log retention policies**

## 🚨 Error Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "status": "fail",
  "message": "User not found",
  "stack": "..." // Only in development
}
```

## 🔄 Migration from Old System

The new error handling system is backward compatible. To migrate:

1. **Replace `throw new Error()`** with `throw new AppError()`
2. **Update error messages** to be more descriptive
3. **Add proper HTTP status codes**
4. **Include relevant context** in error logs
5. **Test error scenarios** thoroughly

## 📚 Additional Resources

- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)
- [Structured Logging with JSON](https://www.loggly.com/blog/structured-logging-json/)

---

**Note**: This error handling system provides a solid foundation for production applications. Regular monitoring and maintenance of logs is essential for application health and security.
