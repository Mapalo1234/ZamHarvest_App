class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.isDropdownOpen = false;
    this.pollingInterval = null;
    this.pollingDelay = 10000; // 10 seconds for auto-refresh (increased from 3 seconds)
    
    this.init();
  }

  init() {
    this.createNotificationDropdown();
    this.bindEvents();
    this.loadNotifications();
    this.startPolling();
  }

  createNotificationDropdown() {
    // Create notification dropdown HTML
    const dropdownHTML = `
      <div class="notification-dropdown" id="notificationDropdown">
        <div class="notification-header">
          <h3>Notifications</h3>
          <div class="notification-actions">
            <button id="markAllReadBtn">Mark All Read</button>
            <button id="refreshBtn">Refresh</button>
          </div>
        </div>
        <div class="notification-list" id="notificationList">
          <div class="notification-empty">
            <i class="fa fa-bell-slash"></i>
            <p>No notifications yet</p>
          </div>
        </div>
        <div class="notification-footer">
          <button id="viewAllBtn">View All Notifications</button>
        </div>
      </div>
    `;

    // Insert dropdown after the notification icon
    const notificationIcon = document.querySelector('.notfication-logo');
    if (notificationIcon) {
      notificationIcon.insertAdjacentHTML('afterend', dropdownHTML);
    }
  }

  bindEvents() {
    const notificationIcon = document.querySelector('.notfication-logo');
    const dropdown = document.getElementById('notificationDropdown');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');

    // Toggle dropdown
    if (notificationIcon) {
      notificationIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && !notificationIcon.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Mark all as read
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        this.markAllAsRead();
      });
    }

    // Refresh notifications
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadNotifications();
      });
    }

    // View all notifications
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        window.location.href = '/notification';
      });
    }
  }

  async loadNotifications() {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const responseData = await response.json();
      
      // Handle new API response format
      const data = responseData.data || responseData;
      this.notifications = data.notifications || [];
      
      // Get unread count separately or calculate it
      if (data.unreadCount !== undefined) {
        this.unreadCount = data.unreadCount;
      } else {
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      }
      
      this.updateBadge();
      this.renderNotifications();
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.showError('Failed to load notifications');
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        // Update local state
        const notification = this.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.isRead = true;
          notification.readAt = new Date();
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.updateBadge();
          this.renderNotifications();
        }
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

      if (response.ok) {
        // Update local state
        this.notifications.forEach(notification => {
          notification.isRead = true;
          notification.readAt = new Date();
        });
        this.unreadCount = 0;
        this.updateBadge();
        this.renderNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  updateBadge() {
    const badge = document.querySelector('.notfication-logo .badge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  renderNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;

    if (this.notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="notification-empty">
          <i class="fa fa-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    const notificationsHTML = this.notifications.map(notification => {
      const timeAgo = this.getTimeAgo(notification.createdAt);
      const iconClass = this.getIconClass(notification.type);
      const iconSymbol = this.getIconSymbol(notification.type);

      return `
        <div class="notification-item ${!notification.isRead ? 'unread' : ''}" 
             data-id="${notification._id}">
          <div class="notification-content">
            <div class="notification-icon ${notification.type}">
              <i class="fa ${iconSymbol}"></i>
            </div>
            <div class="notification-details">
              <h4 class="notification-title">${notification.title}</h4>
              <p class="notification-message">${notification.message}</p>
              <p class="notification-time">${timeAgo}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    notificationList.innerHTML = notificationsHTML;

    // Add click handlers for individual notifications
    notificationList.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const notificationId = item.dataset.id;
        const notification = this.notifications.find(n => n._id === notificationId);
        
        // Handle receipt notifications
        if (notification && notification.type === 'receipt_available') {
          this.handleReceiptNotification(notification);
        }
        
        this.markAsRead(notificationId);
      });
    });
  }

  getIconClass(type) {
    const iconMap = {
      'order_created': 'order_created',
      'order_updated': 'order_updated',
      'order_cancelled': 'order_updated',
      'request_received': 'request_received',
      'request_accepted': 'request_accepted',
      'request_rejected': 'request_rejected',
      'request_updated': 'request_updated',
      'payment_received': 'payment_received',
      'payment_confirmed': 'payment_confirmed',
      'payment_success': 'payment_confirmed',
      'payment_failed': 'payment_failed',
      'delivery_scheduled': 'delivery_scheduled',
      'delivery_confirmed': 'delivery_confirmed',
      'seller_rated': 'seller_rated',
      'review_submitted': 'review_submitted',
      'product_available': 'product_available',
      'message_received': 'message_received',
      'message_sent': 'message_sent',
      'receipt_available': 'receipt_available',
      'receipt_emailed': 'receipt_available',
      'welcome': 'welcome'
    };
    return iconMap[type] || 'order_created';
  }

  getIconSymbol(type) {
    const symbolMap = {
      'order_created': 'fa-shopping-cart',
      'order_updated': 'fa-edit',
      'order_cancelled': 'fa-times-circle',
      'request_received': 'fa-handshake-o',
      'request_accepted': 'fa-check-circle',
      'request_rejected': 'fa-times-circle',
      'request_updated': 'fa-edit',
      'payment_received': 'fa-money',
      'payment_confirmed': 'fa-check-circle',
      'payment_success': 'fa-check-circle',
      'payment_failed': 'fa-times-circle',
      'delivery_scheduled': 'fa-truck',
      'delivery_confirmed': 'fa-check-circle',
      'seller_rated': 'fa-star',
      'review_submitted': 'fa-star',
      'product_available': 'fa-gift',
      'message_received': 'fa-envelope',
      'message_sent': 'fa-paper-plane',
      'receipt_available': 'fa-file-text',
      'receipt_emailed': 'fa-file-text',
      'welcome': 'fa-heart'
    };
    return symbolMap[type] || 'fa-bell';
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  toggleDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.add('show');
      this.isDropdownOpen = true;
      // Refresh notifications when opening
      this.loadNotifications();
    }
  }

  closeDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
      this.isDropdownOpen = false;
    }
  }

  startPolling() {
    // Poll for new notifications every 3 seconds
    this.pollingInterval = setInterval(() => {
      if (!this.isDropdownOpen) {
        this.loadNotifications();
      }
      // Always refresh messages and orders
      this.refreshMessages();
      this.refreshOrders();
    }, this.pollingDelay);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  showError(message) {
    console.error('Notification Error:', message);
    // You can implement a toast notification here
  }

  // Public method to manually refresh notifications
  refresh() {
    this.loadNotifications();
  }

  // Refresh messages if messaging system is available
  refreshMessages() {
    if (window.messagingSystem && typeof window.messagingSystem.loadMessages === 'function') {
      window.messagingSystem.loadMessages();
    }
  }

  // Refresh orders if order table system is available
  refreshOrders() {
    if (window.refreshOrders && typeof window.refreshOrders === 'function') {
      window.refreshOrders();
    } else if (window.fetchOrders && typeof window.fetchOrders === 'function') {
      window.fetchOrders();
    }
  }

  // Handle receipt notification click
  handleReceiptNotification(notification) {
    if (window.receiptSystem && notification.data) {
      // Create order data from notification
      const orderData = {
        orderId: notification.data.orderId,
        productName: notification.data.productName,
        totalPrice: notification.data.amount,
        quantity: 1, // Default quantity
        unit: 'unit',
        sellerName: 'Seller',
        paidStatus: 'Paid'
      };
      
      // Show receipt
      window.receiptSystem.showReceipt(orderData);
    }
  }

  // Cleanup method
  destroy() {
    this.stopPolling();
    // Remove event listeners if needed
  }
}

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if user is logged in
  const user = localStorage.getItem('user');
  if (user) {
    window.notificationSystem = new NotificationSystem();
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
}
