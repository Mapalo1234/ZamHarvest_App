    // Enhanced notification page functionality
    class NotificationPage {
      constructor() {
        this.notifications = [];
        this.filteredNotifications = [];
        this.currentFilter = 'all';
        this.page = 1;
        this.limit = 20;
        
        this.init();
      }
      
      init() {
        this.bindEvents();
        this.setupUserRole();
        this.loadNotifications();
      }
      
      setupUserRole() {
        // Show/hide requests filter based on user role
        const user = JSON.parse(localStorage.getItem('user'));
        const requestsFilter = document.getElementById('requestsFilter');
        
        if (user && user.role === 'seller' && requestsFilter) {
          requestsFilter.style.display = 'block';
        }
      }
      
      bindEvents() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            this.setFilter(e.target.dataset.filter);
          });
        });
        
        // Action buttons
        document.getElementById('markAllReadBtn').addEventListener('click', () => {
          this.markAllAsRead();
        });
        
        document.getElementById('refreshBtn').addEventListener('click', () => {
          this.loadNotifications();
        });
        
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
          this.loadMore();
        });
      }
      
      async loadNotifications() {
        try {
          const response = await fetch('/api/notifications');
          if (!response.ok) throw new Error('Failed to fetch notifications');
          
          const responseData = await response.json();
          
          // Handle new API response format
          const data = responseData.data || responseData;
          this.notifications = data.notifications || [];
          
          // Debug: Log notification types
          console.log('Loaded notifications:', this.notifications.length);
          console.log('Notification types:', this.notifications.map(n => n.type));
          
          this.updateStats();
          this.applyFilter();
          this.renderNotifications();
        } catch (error) {
          console.error('Error loading notifications:', error);
          this.showError('Failed to load notifications');
        }
      }
      
      setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.applyFilter();
        this.renderNotifications();
      }
      
      applyFilter() {
        console.log('Applying filter:', this.currentFilter);
        console.log('Total notifications:', this.notifications.length);
        
        switch (this.currentFilter) {
          case 'unread':
            this.filteredNotifications = this.notifications.filter(n => !n.isRead);
            break;
          case 'orders':
            this.filteredNotifications = this.notifications.filter(n => 
              n.type.includes('order') || n.type.includes('request')
            );
            break;
          case 'requests':
            this.filteredNotifications = this.notifications.filter(n => 
              n.type.includes('request')
            );
            break;
          case 'payments':
            this.filteredNotifications = this.notifications.filter(n => 
              n.type.includes('payment')
            );
            break;
          case 'delivery':
            this.filteredNotifications = this.notifications.filter(n => 
              n.type.includes('delivery') || n.type === 'delivery_scheduled' || 
              n.type === 'delivery_confirmed' || n.type === 'delivery_completed'
            );
            console.log('Delivery notifications found:', this.filteredNotifications.length);
            console.log('Delivery notification types:', this.filteredNotifications.map(n => n.type));
            break;
          case 'reviews':
            this.filteredNotifications = this.notifications.filter(n => 
              n.type.includes('review') || n.type === 'seller_rated' || 
              n.type === 'review_submitted'
            );
            console.log('Review notifications found:', this.filteredNotifications.length);
            console.log('Review notification types:', this.filteredNotifications.map(n => n.type));
            break;
          default:
            this.filteredNotifications = this.notifications;
        }
        
        console.log('Filtered notifications:', this.filteredNotifications.length);
      }
      
      renderNotifications() {
        const container = document.getElementById('notificationsList');
        
        if (this.filteredNotifications.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <i class="fa fa-bell-slash"></i>
              <p>No notifications found</p>
            </div>
          `;
          return;
        }
        
        const html = this.filteredNotifications.map(notification => {
          const timeAgo = this.getTimeAgo(notification.createdAt);
          const iconClass = this.getIconClass(notification.type);
          const iconSymbol = this.getIconSymbol(notification.type);
          
          return `
            <div class="notification-item-page ${!notification.isRead ? 'unread' : ''}" 
                 data-id="${notification._id}">
              <div class="notification-content-page">
                <div class="notification-icon-page ${iconClass}">
                  <i class="fa ${iconSymbol}"></i>
                </div>
                <div class="notification-details-page">
                  <h4 class="notification-title-page">${notification.title}</h4>
                  <p class="notification-message-page">${notification.message}</p>
                  <div class="notification-meta">
                    <span>${timeAgo}</span>
                    <div class="notification-actions-page">
                      ${!notification.isRead ? 
                        `<button class="action-btn primary" onclick="notificationPage.markAsRead('${notification._id}')">Mark Read</button>` : 
                        ''
                      }
                      <button class="action-btn" onclick="notificationPage.deleteNotification('${notification._id}')">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
        
        container.innerHTML = html;
      }
      
      updateStats() {
        const total = this.notifications.length;
        const unread = this.notifications.filter(n => !n.isRead).length;
        const today = this.notifications.filter(n => {
          const notificationDate = new Date(n.createdAt);
          const today = new Date();
          return notificationDate.toDateString() === today.toDateString();
        }).length;
        
        document.getElementById('totalNotifications').textContent = total;
        document.getElementById('unreadNotifications').textContent = unread;
        document.getElementById('todayNotifications').textContent = today;
      }
      
      async markAsRead(notificationId) {
        try {
          const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
          });
          
          if (response.ok) {
            const notification = this.notifications.find(n => n._id === notificationId);
            if (notification) {
              notification.isRead = true;
              notification.readAt = new Date();
              this.updateStats();
              this.applyFilter();
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
            this.notifications.forEach(n => {
              n.isRead = true;
              n.readAt = new Date();
            });
            this.updateStats();
            this.applyFilter();
            this.renderNotifications();
          }
        } catch (error) {
          console.error('Error marking all as read:', error);
        }
      }
      
      async deleteNotification(notificationId) {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        
        try {
          const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            this.notifications = this.notifications.filter(n => n._id !== notificationId);
            this.updateStats();
            this.applyFilter();
            this.renderNotifications();
          }
        } catch (error) {
          console.error('Error deleting notification:', error);
        }
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
          'payment_failed': 'payment_failed',
          'delivery_scheduled': 'delivery_scheduled',
          'delivery_confirmed': 'delivery_confirmed',
          'seller_rated': 'seller_rated',
          'review_submitted': 'review_submitted',
          'product_available': 'product_available',
          'message_received': 'message_received',
          'message_sent': 'message_sent',
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
          'payment_failed': 'fa-times-circle',
          'delivery_scheduled': 'fa-truck',
          'delivery_confirmed': 'fa-check-circle',
          'seller_rated': 'fa-star',
          'review_submitted': 'fa-star',
          'product_available': 'fa-gift',
          'message_received': 'fa-envelope',
          'message_sent': 'fa-paper-plane',
          'welcome': 'fa-heart'
        };
        return symbolMap[type] || 'fa-bell';
      }
      
      getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          return `${minutes}m ago`;
        }
        if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          return `${hours}h ago`;
        }
        if (diffInSeconds < 2592000) {
          const days = Math.floor(diffInSeconds / 86400);
          return `${days}d ago`;
        }
        return date.toLocaleDateString();
      }
      
      showError(message) {
        console.error('Notification Error:', message);
        // You can implement a toast notification here
      }
    }
    
    // Initialize notification page when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
      const user = localStorage.getItem('user');
      if (user) {
        window.notificationPage = new NotificationPage();
      }
    });