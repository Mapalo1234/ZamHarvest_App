/**
 * Global error handler for frontend
 */

class ErrorHandler {
  constructor() {
    this.init();
  }

  init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'Global Error');
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection');
    });

    // Fetch error handler disabled to prevent infinite loops
    // this.interceptFetch();
  }

  handleError(error, context = 'Unknown') {
    console.error(`[${context}]`, error);
    
    // Show user-friendly error message
    this.showErrorMessage('An unexpected error occurred. Please try again.');
    
    // Disabled server logging to prevent infinite loops
    // this.logToServer(error, context);
  }

  showErrorMessage(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f8d7da;
      color: #721c24;
      padding: 15px 20px;
      border: 1px solid #f5c6cb;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 300px;
      font-family: Arial, sans-serif;
    `;
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">⚠️</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: auto;">×</button>
      </div>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        // Only handle non-logging related errors to prevent infinite loops
        if (!args[0] || !args[0].includes('/api/log-error')) {
          this.handleError(error, 'Fetch Error');
        }
        throw error;
      }
    };
  }

  logToServer(error, context) {
    // Disabled server logging to prevent infinite loops
    // Just log to console for now
    console.warn('Error logging disabled to prevent infinite loops:', {
      error: error.message,
      context: context,
      timestamp: new Date().toISOString()
    });
  }

  // Utility method for handling async operations
  async handleAsync(operation, context = 'Async Operation') {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }

  // Utility method for handling promises
  handlePromise(promise, context = 'Promise') {
    return promise.catch(error => {
      this.handleError(error, context);
      throw error;
    });
  }
}

// Initialize error handler
const errorHandler = new ErrorHandler();

// Export for use in other modules
window.ErrorHandler = errorHandler;
