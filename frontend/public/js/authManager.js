class AuthManager {
  constructor() {
    this.user = null;
    this.isLoggedIn = false;
    this.init();
  }

  init() {
    this.loadUser();
    this.updateUI();
    this.bindEvents();
  }

  loadUser() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
        this.isLoggedIn = true;
        console.log('User loaded:', this.user);
      } else {
        this.isLoggedIn = false;
        console.log('No user found');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      this.isLoggedIn = false;
    }
  }

  updateUI() {
    this.updateLoginDropdown();
    this.updateCarouselButtons();
    this.updateWelcomeSection();
    this.updateNavigation();
  }

  updateLoginDropdown() {
    const dropdown = document.getElementById('loginDropdown');
    if (!dropdown) return;

    if (this.isLoggedIn && this.user) {
      dropdown.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">
            <i class="fa fa-user-circle" aria-hidden="true"></i>
          </div>
          <div class="user-details">
            <h4>${this.user.username}</h4>
            <p>${this.user.email}</p>
            <span class="user-role">${this.user.role}</span>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        <a href="/notification" class="dropdown-item">
          <i class="fa fa-bell" aria-hidden="true"></i>
          Notifications
        </a>
        ${this.user.role === 'seller' ? `
        <a href="/view" class="dropdown-item">
          <i class="fa fa-plus-circle" aria-hidden="true"></i>
          Add Products
        </a>
        <a href="/request" class="dropdown-item">
          <i class="fa fa-handshake-o" aria-hidden="true"></i>
          Requests
        </a>
        ` : `
        <a href="/listproduct" class="dropdown-item">
          <i class="fa fa-shopping-bag" aria-hidden="true"></i>
          Browse Products
        </a>
        `}
        <div class="dropdown-divider"></div>
        <a href="#" class="dropdown-item" id="logoutBtn">
          <i class="fa fa-sign-out" aria-hidden="true"></i>
          Logout
        </a>
      `;
    } else {
      dropdown.innerHTML = `
        <a href="/login" class="dropdown-item">
          <i class="fa fa-sign-in" aria-hidden="true"></i>
          Login
        </a>
        <a href="/signup" class="dropdown-item">
          <i class="fa fa-user-plus" aria-hidden="true"></i>
          Sign Up
        </a>
        <div class="dropdown-divider"></div>
        <a href="#" class="dropdown-item">
          <i class="fa fa-info-circle" aria-hidden="true"></i>
          About Us
        </a>
      `;
    }
  }

  updateCarouselButtons() {
    const buttons1 = document.getElementById('carouselButtons');
    const buttons2 = document.getElementById('carouselButtons2');

    if (this.isLoggedIn && this.user) {
      // Logged in user buttons
      const loggedInButtons = `
        <button onclick="window.location.href='/listproduct'" class="btn-primary">
          <i class="fa fa-shopping-bag" aria-hidden="true"></i>
          Browse Products
        </button>
        <button onclick="window.location.href='/orderTable'" class="btn-secondary">
          <i class="fa fa-shopping-cart" aria-hidden="true"></i>
          My Orders
        </button>
      `;
      
      if (buttons1) buttons1.innerHTML = loggedInButtons;
      if (buttons2) buttons2.innerHTML = loggedInButtons;
    } else {
      // Guest user buttons
      const guestButtons = `
        <button onclick="window.location.href='/login'" class="btn-primary">
          <i class="fa fa-sign-in" aria-hidden="true"></i>
          LOG IN
        </button>
        <button onclick="window.location.href='/login'" class="btn-secondary">
          <i class="fa fa-user-plus" aria-hidden="true"></i>
          SIGN UP
        </button>
      `;
      
      if (buttons1) buttons1.innerHTML = guestButtons;
      if (buttons2) buttons2.innerHTML = `
        <button onclick="window.location.href='/listproduct'" class="btn-primary">
          <i class="fa fa-eye" aria-hidden="true"></i>
          SEE MORE
        </button>
        <button onclick="window.location.href='/signup'" class="btn-secondary">
          <i class="fa fa-bell" aria-hidden="true"></i>
          SUBSCRIBE
        </button>
      `;
    }
  }

  updateWelcomeSection() {
    const welcomeSection = document.getElementById('welcomeSection');
    if (!welcomeSection) return;

    if (this.isLoggedIn && this.user) {
      welcomeSection.innerHTML = `
        <div class="welcome-logged-in">
          <h1>Welcome back, ${this.user.username}!</h1>
          <p>
          Connecting growers with commercial produce buyers to purchase all
          grades of producedirect-from-farm  <span class="text" ></span> on spot, program, or contract
          terms.
        </p>
          <p>Ready to ${this.user.role === 'buyer' ? 'find fresh produce' : 'sell your products'}?</p>
          <div class="quick-actions">
            ${this.user.role === 'buyer' ? `
              <a href="/listproduct" class="action-btn">
                <i class="fa fa-shopping-bag" aria-hidden="true"></i>
                Browse Products
              </a>
              <a href="/orderTable" class="action-btn">
                <i class="fa fa-shopping-cart" aria-hidden="true"></i>
                My Orders
              </a>
            ` : `
              <a href="/view" class="action-btn">
                <i class="fa fa-plus-circle" aria-hidden="true"></i>
                Add Products
              </a>
              <a href="/request" class="action-btn">
                <i class="fa fa-handshake-o" aria-hidden="true"></i>
                View Requests
              </a>
            `}
          </div>
        </div>
      `;
    } else {
      welcomeSection.innerHTML = `
        <div class="welcome-guest">
          <h1>Welcome to ZamHarvest!</h1>
                    <p>
          Connecting growers with commercial produce buyers to purchase all
          grades of producedirect-from-farm  <span class="text" ></span> on spot, program, or contract
          terms.
        </p>
          <p>Join our marketplace to buy and sell fresh produce</p>
          <div class="welcome-actions">
            <a href="/signup" class="welcome-btn primary">
              <i class="fa fa-user-plus" aria-hidden="true"></i>
              Get Started
            </a>
            <a href="/login" class="welcome-btn secondary">
              <i class="fa fa-sign-in" aria-hidden="true"></i>
              Sign In
            </a>
          </div>
        </div>
      `;
    }
  }

  updateNavigation() {
    // Update navigation based on user role
    const marketplaceItem = document.querySelector('.menu li:first-child');
    if (marketplaceItem && this.isLoggedIn) {
      const submenu = marketplaceItem.querySelector('.submenu');
      if (submenu) {
        if (this.user.role === 'buyer') {
          submenu.innerHTML = `
            <li><a href="/listproduct">Browse Products</a></li>
            <li><a href="/orderTable">My Orders</a></li>
          `;
        } else if (this.user.role === 'seller') {
          submenu.innerHTML = `
            <li><a href="/view">Add Products</a></li>
            <li><a href="/request">View Requests</a></li>
          `;
        }
      }
    }
  }

  bindEvents() {
    // Handle logout
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logoutBtn' || (e.target && e.target.closest && e.target.closest('#logoutBtn'))) {
        e.preventDefault();
        this.logout();
      }
    });

    // The login dropdown toggle is handled by loginscript.js
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      // Clear user data
      localStorage.removeItem('user');
      this.user = null;
      this.isLoggedIn = false;
      
      // Update UI
      this.updateUI();
      
      // Redirect to home page
      window.location.href = '/home';
      
      // Show success message
      this.showMessage('Logged out successfully!', 'success');
    }
  }

  showMessage(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa fa-${type === 'success' ? 'check-circle' : 'info-circle'}" aria-hidden="true"></i>
      <span>${message}</span>
    `;
    
    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      right: 50%;
      background: ${type === 'success' ? '#0c670fff' : '#2196F3'};
      color: white;
      padding: 50px 50px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideIn 0.30s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.6s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Public method to refresh user data
  refresh() {
    this.loadUser();
    this.updateUI();
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});

