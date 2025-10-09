/**
 * Notification Manager
 * Handles frontend notification display and management
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isConnected = false;
        this.pollInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startPolling();
        this.loadNotifications();
    }

    setupEventListeners() {
        // Listen for notification clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.notification-item')) {
                this.handleNotificationClick(e.target.closest('.notification-item'));
            }
        });

        // Listen for mark all as read
        document.addEventListener('click', (e) => {
            if (e.target.id === 'markAllReadBtn') {
                this.markAllAsRead();
            }
        });

        // Listen for delete notification
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-notification-btn')) {
                const notificationId = e.target.closest('.delete-notification-btn').dataset.notificationId;
                this.deleteNotification(notificationId);
            }
        });
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) {
                throw new Error('Failed to load notifications');
            }

            const data = await response.json();
            this.notifications = data.data?.notifications || data.notifications || [];
            this.unreadCount = data.data?.unreadCount || data.unreadCount || 0;
            
            this.updateNotificationDisplay();
            this.updateUnreadCount();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async getUnreadCount() {
        try {
            const response = await fetch('/api/notifications/unread-count');
            if (!response.ok) {
                throw new Error('Failed to get unread count');
            }

            const data = await response.json();
            this.unreadCount = data.data?.count || data.count || 0;
            this.updateUnreadCount();
            return this.unreadCount;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    updateNotificationDisplay() {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <div class="no-notifications-icon">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <h3>No Notifications</h3>
                    <p>You don't have any notifications yet.</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.isRead ? 'read' : 'unread'}" 
                 data-notification-id="${notification._id}">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4 class="notification-title">${notification.title}</h4>
                        <span class="notification-time">${this.formatTime(notification.createdAt)}</span>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                    <div class="notification-actions">
                        <button class="delete-notification-btn" 
                                data-notification-id="${notification._id}"
                                title="Delete notification">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = notificationsHTML;
    }

    getNotificationIcon(type) {
        const icons = {
            'order_created': '<i class="fas fa-shopping-cart"></i>',
            'order_updated': '<i class="fas fa-edit"></i>',
            'order_cancelled': '<i class="fas fa-times-circle"></i>',
            'order_delivered': '<i class="fas fa-truck"></i>',
            'order_completed': '<i class="fas fa-check-circle"></i>',
            'request_received': '<i class="fas fa-handshake"></i>',
            'request_accepted': '<i class="fas fa-check"></i>',
            'request_rejected': '<i class="fas fa-times"></i>',
            'payment_success': '<i class="fas fa-credit-card"></i>',
            'payment_failed': '<i class="fas fa-exclamation-triangle"></i>',
            'payment_received': '<i class="fas fa-money-bill-wave"></i>',
            'delivery_scheduled': '<i class="fas fa-calendar"></i>',
            'delivery_confirmed': '<i class="fas fa-check-double"></i>',
            'seller_rated': '<i class="fas fa-star"></i>',
            'review_submitted': '<i class="fas fa-star-half-alt"></i>',
            'product_added': '<i class="fas fa-plus-circle"></i>',
            'product_updated': '<i class="fas fa-edit"></i>',
            'product_out_of_stock': '<i class="fas fa-exclamation-circle"></i>',
            'low_stock': '<i class="fas fa-exclamation-triangle"></i>',
            'message_received': '<i class="fas fa-envelope"></i>',
            'message_sent': '<i class="fas fa-paper-plane"></i>',
            'receipt_available': '<i class="fas fa-receipt"></i>',
            'receipt_emailed': '<i class="fas fa-envelope-open"></i>',
            'welcome': '<i class="fas fa-hand-wave"></i>',
            'user_registered': '<i class="fas fa-user-plus"></i>'
        };

        return icons[type] || '<i class="fas fa-bell"></i>';
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }
    }

    updateUnreadCount() {
        // Update notification badge
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }

        // Update notification count in header
        const countElement = document.getElementById('notificationCount');
        if (countElement) {
            countElement.textContent = this.unreadCount;
        }
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }

            // Update local state
            const notification = this.notifications.find(n => n._id === notificationId);
            if (notification) {
                notification.isRead = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateNotificationDisplay();
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }

            // Update local state
            this.notifications.forEach(notification => {
                notification.isRead = true;
            });
            this.unreadCount = 0;
            this.updateNotificationDisplay();
            this.updateUnreadCount();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    async deleteNotification(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }

            // Update local state
            const notificationIndex = this.notifications.findIndex(n => n._id === notificationId);
            if (notificationIndex !== -1) {
                const notification = this.notifications[notificationIndex];
                this.notifications.splice(notificationIndex, 1);
                
                if (!notification.isRead) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
                
                this.updateNotificationDisplay();
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    handleNotificationClick(notificationElement) {
        const notificationId = notificationElement.dataset.notificationId;
        const notification = this.notifications.find(n => n._id === notificationId);
        
        if (notification && !notification.isRead) {
            this.markAsRead(notificationId);
        }

        // Handle notification-specific actions
        this.handleNotificationAction(notification);
    }

    handleNotificationAction(notification) {
        switch (notification.type) {
            case 'order_created':
            case 'order_updated':
            case 'order_delivered':
            case 'order_completed':
                if (notification.data?.orderId) {
                    window.location.href = `/orderTable?orderId=${notification.data.orderId}`;
                }
                break;
            case 'request_received':
            case 'request_accepted':
            case 'request_rejected':
                if (notification.data?.requestId) {
                    window.location.href = `/request?requestId=${notification.data.requestId}`;
                }
                break;
            case 'message_received':
                if (notification.data?.conversationId) {
                    window.location.href = `/messaging?conversationId=${notification.data.conversationId}`;
                }
                break;
            case 'product_added':
            case 'product_updated':
                if (notification.data?.productId) {
                    window.location.href = `/view?productId=${notification.data.productId}`;
                }
                break;
            case 'seller_rated':
            case 'review_submitted':
                if (notification.data?.productId) {
                    window.location.href = `/productDetail?productId=${notification.data.productId}`;
                }
                break;
            default:
                console.log('No specific action for notification type:', notification.type);
        }
    }

    startPolling() {
        // Poll for new notifications every 30 seconds
        this.pollInterval = setInterval(() => {
            this.getUnreadCount();
        }, 30000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    // Show toast notification
    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-icon">${this.getNotificationIcon(notification.type)}</div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Cleanup
    destroy() {
        this.stopPolling();
        this.setupEventListeners = null;
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
