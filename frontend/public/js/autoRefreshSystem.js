/**
 * Auto-Refresh System
 * Coordinates automatic refreshing of notifications, messages, and orders
 */
class AutoRefreshSystem {
    constructor() {
        this.isEnabled = true;
        this.refreshInterval = 10000; // 10 seconds (increased from 3 seconds)
        this.intervalId = null;
        this.lastRefresh = Date.now();
        
        this.init();
    }

    init() {
        // Silent initialization - auto-refresh works in background
        this.startAutoRefresh();
        
        // Add visibility change listener to pause/resume when tab is not active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoRefresh();
            } else {
                this.resumeAutoRefresh();
            }
        });
    }

    startAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(() => {
            if (this.isEnabled) {
                this.performRefresh();
            }
        }, this.refreshInterval);
    }

    pauseAutoRefresh() {
        // Silent pause - no console logging
        this.isEnabled = false;
    }

    resumeAutoRefresh() {
        // Silent resume - no console logging
        this.isEnabled = true;
        // Perform immediate refresh when tab becomes visible
        this.performRefresh();
    }

    performRefresh() {
        const now = Date.now();
        const timeSinceLastRefresh = now - this.lastRefresh;
        
        // Only refresh if enough time has passed
        if (timeSinceLastRefresh >= this.refreshInterval) {
            // Silent refresh - no console logging
            this.lastRefresh = now;
            
            // Refresh notifications
            this.refreshNotifications();
            
            // Refresh messages
            this.refreshMessages();
            
            // Refresh orders
            this.refreshOrders();
        }
    }

    refreshNotifications() {
        try {
            if (window.notificationSystem && typeof window.notificationSystem.loadNotifications === 'function') {
                window.notificationSystem.loadNotifications();
            }
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        }
    }

    refreshMessages() {
        try {
            if (window.messagingSystem && typeof window.messagingSystem.loadMessages === 'function') {
                window.messagingSystem.loadMessages();
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
        }
    }

    refreshOrders() {
        try {
            if (window.fetchOrders && typeof window.fetchOrders === 'function') {
                window.fetchOrders();
            }
        } catch (error) {
            console.error('Error refreshing orders:', error);
        }
    }

    // Public methods for manual control
    enable() {
        this.isEnabled = true;
        console.log('Auto-refresh enabled');
    }

    disable() {
        this.isEnabled = false;
        console.log('Auto-refresh disabled');
    }

    setRefreshInterval(interval) {
        this.refreshInterval = interval;
        if (this.intervalId) {
            this.startAutoRefresh();
        }
        console.log(`Auto-refresh interval set to ${interval}ms`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('Auto-refresh stopped');
    }

    // Show/hide indicator
    showIndicator() {
        const indicator = document.getElementById('autoRefreshIndicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    hideIndicator() {
        const indicator = document.getElementById('autoRefreshIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // Get status
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            refreshInterval: this.refreshInterval,
            isRunning: this.intervalId !== null,
            lastRefresh: this.lastRefresh
        };
    }
}

// Initialize auto-refresh system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.autoRefreshSystem = new AutoRefreshSystem();
    
    // Make it globally accessible
    window.autoRefresh = window.autoRefreshSystem;
    
    // Silent initialization - no console logging
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoRefreshSystem;
}
