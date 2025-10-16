class ReviewSystem {
  constructor() {
    this.currentOrderId = null;
    this.currentSellerId = null;
    this.currentProductId = null;
    this.ordersData = [];
  }

  // Initialize review system
  init() {
    this.debugAuthState();
    this.loadReviewableOrders();
    this.setupEventListeners();
  }

  // Debug authentication state
  debugAuthState() {
    console.log('=== Review System Auth Debug ===');
    console.log('localStorage user:', localStorage.getItem('user'));
    console.log('localStorage userId:', localStorage.getItem('userId'));
    console.log('localStorage buyerId:', localStorage.getItem('buyerId'));
    console.log('sessionStorage userId:', sessionStorage.getItem('userId'));
    console.log('sessionStorage buyerId:', sessionStorage.getItem('buyerId'));
    console.log('window.currentUser:', window.currentUser);
    console.log('window.authManager:', window.authManager);
    console.log('getBuyerId result:', this.getBuyerId());
    console.log('================================');
  }

  // Load orders that can be reviewed
  async loadReviewableOrders() {
    try {
      const response = await fetch('/api/reviewable-orders', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        this.displayReviewableOrders(data.orders);
      } else {
        this.hideReviewSection();
      }
    } catch (error) {
      console.error('Error loading reviewable orders:', error);
    }
  }

  // Display reviewable orders
  displayReviewableOrders(orders) {
    const reviewSection = document.getElementById('reviewSection');
    if (!reviewSection) return;

    // Store orders data for reference
    this.ordersData = orders;

    console.log('Displaying reviewable orders:', orders);
    if (orders.length > 0) {
      console.log('First order structure:', orders[0]);
    }

    const ordersHtml = orders.map((order, index) => {
      return `
        <div class="reviewable-order" data-order-id="${order._id}">
          <div class="order-info">
            <img src="${order.productId.image}" alt="${order.productId.name}" class="product-image">
            <div class="order-details">
              <h4>${order.productId.name}</h4>
              <p>Seller: ${order.sellerId.username}</p>
              <p>Delivered: ${new Date(order.deliveredAt).toLocaleDateString()}</p>
              <p>Quantity: ${order.quantity} ${order.unit}</p>
            </div>
          </div>
          <button class="review-btn" onclick="reviewSystem.openReviewFormByIndex(${index})">
            Write Review
          </button>
        </div>
      `;
    }).join('');

    reviewSection.innerHTML = `
      <h3>Orders Ready for Review</h3>
      <div class="reviewable-orders">
        ${ordersHtml}
      </div>
    `;
  }

  // Open review form by index (new method)
  openReviewFormByIndex(orderIndex) {
    console.log('Opening review form for order index:', orderIndex);
    
    if (!this.ordersData || !this.ordersData[orderIndex]) {
      console.error('Order data not found for index:', orderIndex);
      alert('Error: Order data not found. Please refresh the page and try again.');
      return;
    }
    
    const order = this.ordersData[orderIndex];
    console.log('Selected order:', order);
    
    // Extract IDs directly from the order object
    const orderId = order._id;
    const sellerId = order.sellerId._id || order.sellerId;
    const productId = order.productId._id || order.productId;
    
    console.log('Extracted IDs:', { orderId, sellerId, productId });
    
    // Validate IDs
    if (!orderId || !sellerId || !productId) {
      console.error('Missing required IDs:', { orderId, sellerId, productId });
      alert('Error: Missing order data. Please refresh the page and try again.');
      return;
    }
    
    // Set current review data
    this.currentOrderId = orderId;
    this.currentSellerId = sellerId.toString();
    this.currentProductId = productId.toString();
    
    console.log('Review form data set:', {
      currentOrderId: this.currentOrderId,
      currentSellerId: this.currentSellerId,
      currentProductId: this.currentProductId
    });

    // Show modal
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'block';
      this.resetReviewForm();
    }
  }

  // Open review form (legacy method for compatibility with orderTable.js)
  openReviewForm(orderId, sellerId, productId) {
    console.log('Opening review form with IDs:', { orderId, sellerId, productId });
    
    // Validate IDs
    if (!orderId || !sellerId || !productId) {
      console.error('Missing required IDs:', { orderId, sellerId, productId });
      alert('Error: Missing order data. Please refresh the page and try again.');
      return;
    }
    
    // Set current review data
    this.currentOrderId = orderId;
    this.currentSellerId = sellerId.toString();
    this.currentProductId = productId.toString();
    
    console.log('Review form data set:', {
      currentOrderId: this.currentOrderId,
      currentSellerId: this.currentSellerId,
      currentProductId: this.currentProductId
    });

    // Show modal
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'block';
      this.resetReviewForm();
    }
  }

  // Close review form
  closeReviewForm() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Reset review form
  resetReviewForm() {
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewRating').value = '5';
    document.getElementById('reviewExperience').value = '';
    this.updateStarDisplay(5);
  }

  // Update star display
  updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Star rating interaction
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('star')) {
        const rating = parseInt(e.target.dataset.rating);
        document.getElementById('reviewRating').value = rating;
        this.updateStarDisplay(rating);
      }
    });

    // Character counter for textarea
    const commentTextarea = document.getElementById('reviewComment');
    if (commentTextarea) {
      commentTextarea.addEventListener('input', (e) => {
        const charCount = e.target.value.length;
        const charCountElement = document.querySelector('.char-count');
        if (charCountElement) {
          charCountElement.textContent = `${charCount}/500 characters`;
        }
      });
    }

    // Star hover effect
    document.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('star')) {
        const rating = parseInt(e.target.dataset.rating);
        this.updateStarDisplay(rating);
      }
    });

    // Reset stars on mouse leave
    document.addEventListener('mouseleave', (e) => {
      if (e.target && e.target.closest && e.target.closest('.star-rating')) {
        const currentRating = parseInt(document.getElementById('reviewRating').value);
        this.updateStarDisplay(currentRating);
      }
    });

    // Form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitReview();
      });
    }

    // Close modal on outside click
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeReviewForm();
        }
      });
    }
  }

  // Submit review
  async submitReview() {
    const comment = document.getElementById('reviewComment').value.trim();
    const rating = parseInt(document.getElementById('reviewRating').value);
    const experience = document.getElementById('reviewExperience').value;

    // Validate form data
    if (!comment || !experience || isNaN(rating) || rating < 1 || rating > 5) {
      alert('Please fill in all fields correctly');
      return;
    }

    if (comment.length > 500) {
      alert('Comment must be 500 characters or less');
      return;
    }

    // Validate that we have the required IDs
    if (!this.currentOrderId || !this.currentSellerId || !this.currentProductId) {
      alert('Error: Missing order data. Please refresh the page and try again.');
      console.error('Missing IDs:', {
        orderId: this.currentOrderId,
        sellerId: this.currentSellerId,
        productId: this.currentProductId
      });
      return;
    }

    // Get buyer ID
    let buyerId = this.getBuyerId();
    if (!buyerId) {
      buyerId = await this.getBuyerIdFromSession();
    }
    
    if (!buyerId) {
      alert('Please log in to submit a review');
      return;
    }

    try {
      // Prepare request body
      const requestBody = {
        orderId: this.currentOrderId,
        productId: this.currentProductId,
        sellerId: this.currentSellerId,
        rating,
        comment,
        experience,
        buyerId
      };

      console.log('Submitting review with data:', requestBody);

      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review submitted successfully!');
        this.closeReviewForm();
        this.loadReviewableOrders(); // Refresh the list
      } else {
        alert(data.error || 'Failed to submit review');
        console.error('Review submission failed:', data);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  }

  // Load seller reviews
  async loadSellerReviews(sellerId) {
    if (!sellerId) return;

    try {
      const response = await fetch(`/api/reviews/seller/${sellerId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.reviews) {
          this.displaySellerReviews(data.reviews);
        }
      } else {
        console.warn('Failed to load seller reviews:', response.status, response.statusText);
        this.displaySellerReviews([]);
      }
    } catch (error) {
      console.error('Error loading seller reviews:', error);
      this.displaySellerReviews([]);
    }
  }

  // Display seller reviews
  displaySellerReviews(reviews) {
    const reviewsContainer = document.getElementById('sellerReviews');
    if (!reviewsContainer) return;

    if (reviews.length === 0) {
      reviewsContainer.innerHTML = '<p>No reviews yet</p>';
      return;
    }

    const reviewsHtml = reviews.map(review => `
      <div class="review-item">
        <div class="review-header">
          <div class="reviewer-info">
            <strong>${review.buyerId.username}</strong>
            <div class="star-rating-display">
              ${this.generateStarHtml(review.rating)}
            </div>
          </div>
          <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
        <h5 class="review-experience">Experience: ${review.experience ? review.experience.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}</h5>
        <p class="review-comment">${review.comment}</p>
        <div class="review-product">
          <small>Product: ${review.productId.name}</small>
        </div>
      </div>
    `).join('');

    reviewsContainer.innerHTML = reviewsHtml;
  }

  // Generate star HTML for display
  generateStarHtml(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      const activeClass = i <= rating ? 'active' : '';
      stars += `<span class="star-display ${activeClass}">★</span>`;
    }
    return stars;
  }

  // Hide review section if no reviewable orders
  hideReviewSection() {
    const reviewSection = document.getElementById('reviewSection');
    if (reviewSection) {
      reviewSection.style.display = 'none';
    }
  }

  // Get buyer ID from session or localStorage
  getBuyerId() {
    // Try to get from sessionStorage first
    let buyerId = sessionStorage.getItem('userId') || sessionStorage.getItem('buyerId');
    
    // If not found, try localStorage
    if (!buyerId) {
      buyerId = localStorage.getItem('userId') || localStorage.getItem('buyerId');
    }
    
    // If still not found, try to get from the user object in localStorage
    if (!buyerId) {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          buyerId = user.id || user._id;
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
    
    // If still not found, try to get from a global variable
    if (!buyerId && window.currentUser) {
      buyerId = window.currentUser.id || window.currentUser._id;
    }
    
    // If still not found, try to get from AuthManager if available
    if (!buyerId && window.authManager && window.authManager.user) {
      buyerId = window.authManager.user.id || window.authManager.user._id;
    }
    
    return buyerId;
  }

  // Alternative method to get buyer ID from session API
  async getBuyerIdFromSession() {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        return sessionData.data?.user?.id || sessionData.user?.id;
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
    return null;
  }
}

// Initialize review system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.reviewSystem = new ReviewSystem();
  window.reviewSystem.init();
});