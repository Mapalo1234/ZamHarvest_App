/**
 * Performance monitoring utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Start timing an operation
   * @param {string} operation - Operation name
   * @returns {string} Timer ID
   */
  startTimer(operation) {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.metrics.set(timerId, {
      operation,
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage()
    });
    return timerId;
  }

  /**
   * End timing an operation
   * @param {string} timerId - Timer ID
   * @returns {Object} Performance metrics
   */
  endTimer(timerId) {
    const metric = this.metrics.get(timerId);
    if (!metric) {
      console.warn(`Timer ${timerId} not found`);
      return null;
    }

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - metric.startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - metric.startMemory.rss,
      heapUsed: endMemory.heapUsed - metric.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - metric.startMemory.heapTotal,
      external: endMemory.external - metric.startMemory.external
    };

    const result = {
      operation: metric.operation,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      memoryDelta,
      timestamp: new Date().toISOString()
    };

    // Log slow operations
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow operation detected: ${metric.operation} took ${duration}ms`);
    }

    // Clean up
    this.metrics.delete(timerId);
    
    return result;
  }

  /**
   * Monitor database query performance
   * @param {Function} queryFunction - Database query function
   * @param {string} operation - Operation name
   * @returns {Promise} Query result with performance data
   */
  async monitorQuery(queryFunction, operation) {
    const timerId = this.startTimer(operation);
    try {
      const result = await queryFunction();
      const metrics = this.endTimer(timerId);
      
      // Log query performance
      console.log(`Query ${operation}: ${metrics.duration}ms`);
      
      return result;
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Monitor API endpoint performance
   * @param {Function} handler - API handler function
   * @param {string} endpoint - Endpoint name
   * @returns {Function} Wrapped handler
   */
  monitorEndpoint(handler, endpoint) {
    return async (req, res, next) => {
      const timerId = this.startTimer(`API_${endpoint}`);
      
      // Override res.json to capture response time
      const originalJson = res.json;
      res.json = function(data) {
        const metrics = performanceMonitor.endTimer(timerId);
        if (metrics) {
          console.log(`API ${endpoint}: ${metrics.duration}ms`);
        }
        return originalJson.call(this, data);
      };

      try {
        await handler(req, res, next);
      } catch (error) {
        this.endTimer(timerId);
        throw error;
      }
    };
  }

  /**
   * Get memory usage statistics
   * @returns {Object} Memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100 // MB
    };
  }

  /**
   * Get system performance metrics
   * @returns {Object} System metrics
   */
  getSystemMetrics() {
    return {
      uptime: process.uptime(),
      memory: this.getMemoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
