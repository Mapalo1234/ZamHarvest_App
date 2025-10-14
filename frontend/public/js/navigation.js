class NavigationManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupActiveTabDetection();
    this.setupUnderlineAnimation();
    this.bindEvents();
  }

  setupActiveTabDetection() {
    // Get current page path
    const currentPath = window.location.pathname;
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu > li > a').forEach(link => {
      link.classList.remove('active');
    });

    // Add active class based on current page
    this.setActiveTab(currentPath);
  }

  setActiveTab(currentPath) {
    const menuItems = document.querySelectorAll('.menu > li > a');
    
    menuItems.forEach(link => {
      const href = link.getAttribute('href');
      
      // Check if current path matches the link
      if (this.isPathMatch(currentPath, href)) {
        link.classList.add('active');
        this.moveUnderline(link);
      }
    });
  }

  isPathMatch(currentPath, href) {
    // Handle exact matches
    if (currentPath === href) return true;
    
    // Handle special cases
    if (href === '/home' && (currentPath === '/' || currentPath === '/home')) return true;
    if (href === '/listproduct' && currentPath.includes('/listproduct')) return true;
    if (href === '/view' && currentPath.includes('/view')) return true;
    if (href === '/messaging' && currentPath.includes('/messaging')) return true;
    if (href === '/notification' && currentPath.includes('/notification')) return true;
    if (href === '/orderTable' && currentPath.includes('/orderTable')) return true;
    if (href === '/request' && currentPath.includes('/request')) return true;
    
    return false;
  }

  setupUnderlineAnimation() {
    // The underline is now handled by CSS ::before pseudo-element
    // No need to create or position a separate element
  }

  moveUnderline(activeTab) {
    // The underline animation is now handled by CSS
    // The ::before pseudo-element will automatically show/hide based on .active class
  }

  bindEvents() {
    // Handle menu item clicks
    document.querySelectorAll('.menu > li > a').forEach(link => {
      link.addEventListener('click', (e) => {
        // Remove active class from all menu items
        document.querySelectorAll('.menu > li > a').forEach(l => {
          l.classList.remove('active');
        });
        
        // Add active class to clicked item
        link.classList.add('active');
        
        // Move underline
        this.moveUnderline(link);
      });
    });

    // Handle submenu clicks
    document.querySelectorAll('.submenu a').forEach(link => {
      link.addEventListener('click', (e) => {
        // Remove active class from all menu items
        document.querySelectorAll('.menu > li > a').forEach(l => {
          l.classList.remove('active');
        });
        
        // Add active class to parent menu item
        const parentMenuLink = link.closest('li').parentElement.previousElementSibling;
        if (parentMenuLink) {
          parentMenuLink.classList.add('active');
          this.moveUnderline(parentMenuLink);
        }
      });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      const activeTab = document.querySelector('.menu > li > a.active');
      if (activeTab) {
        this.moveUnderline(activeTab);
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navigationManager = new NavigationManager();
});
