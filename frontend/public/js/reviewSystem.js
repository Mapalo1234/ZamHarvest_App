class ReviewSystem {
  constructor() {
    this.currentOrderId = null;
    this.currentSellerId = null;
    this.currentProductId = null;
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
      const response = await fetch('/api/reviewable-orders');
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

    const ordersHtml = orders.map(order => `
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
        <button class="review-btn" onclick="reviewSystem.openReviewForm('${order._id}', '${order.sellerId._id}', '${order.productId._id}')">
          Write Review
        </button>
      </div>
    `).join('');

    reviewSection.innerHTML = `
      <h3>Orders Ready for Review</h3>
      <div class="reviewable-orders">
        ${ordersHtml}
      </div>
    `;
  }

  // Open review form
  openReviewForm(orderId, sellerId, productId) {
    this.currentOrderId = orderId;
    this.currentSellerId = sellerId;
    this.currentProductId = productId;

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
    console.log('Form reset - rating set to 5, experience cleared');
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
        console.log('Star clicked, rating set to:', rating);
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

    console.log('Form validation debug:', {
      comment: comment,
      rating: rating,
      experience: experience,
      commentLength: comment.length,
      ratingValid: !isNaN(rating) && rating >= 1 && rating <= 5,
      experienceValid: experience && experience !== ''
    });

    if (!comment || !experience || isNaN(rating) || rating < 1 || rating > 5) {
      alert('Please fill in all fields correctly');
      return;
    }

    if (comment.length > 500) {
      alert('Comment must be 500 characters or less');
      return;
    }

    // Debug logging for review context
    console.log('Review submission context:', {
      currentOrderId: this.currentOrderId,
      currentProductId: this.currentProductId,
      currentSellerId: this.currentSellerId
    });

    try {
      // Determine if this is an order review or product review
      // Priority: If we have an orderId, it's an order review (even if productId is also set)
      // If we only have productId, it's a product review
      const isOrderReview = !!this.currentOrderId;
      const isProductReview = !this.currentOrderId && !!this.currentProductId;

      // Get buyer ID from session or localStorage
      let buyerId = this.getBuyerId();
      
      // If not found in localStorage, try to get from session API
      if (!buyerId) {
        console.log('Buyer ID not found in localStorage, trying session API...');
        buyerId = await this.getBuyerIdFromSession();
      }
      
      if (!buyerId) {
        alert('Please log in to submit a review');
        console.error('No buyer ID found in localStorage or session');
        return;
      }

      let requestBody = {
        rating,
        comment,
        experience,
        buyerId
      };

      if (isOrderReview) {
        requestBody.orderId = this.currentOrderId;
        // Also include productId and sellerId for order reviews
        if (this.currentProductId) {
          requestBody.productId = this.currentProductId;
        }
        if (this.currentSellerId) {
          requestBody.sellerId = this.currentSellerId;
        }
      } else if (isProductReview) {
        // For product reviews, we need to find an order for this product
        // This is a simplified approach - in reality you'd need to check if user has a delivered order
        requestBody.productId = this.currentProductId;
        requestBody.sellerId = this.currentSellerId;
      } else {
        alert('Unable to determine review type. Please ensure you are reviewing from a valid page.');
        console.error('Review context:', {
          currentOrderId: this.currentOrderId,
          currentProductId: this.currentProductId,
          currentSellerId: this.currentSellerId
        });
        return;
      }

      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review submitted successfully!');
        this.closeReviewForm();
        
        // Refresh appropriate content based on review type
        if (isOrderReview) {
          this.loadReviewableOrders(); // Refresh the list
        }
        if (isProductReview) {
          // Refresh product reviews if on product detail page
          if (typeof loadProductReviews === 'function') {
            loadProductReviews(this.currentProductId);
          }
        }
        this.loadSellerReviews(); // Refresh seller reviews if on seller page
      } else {
        alert(data.error || 'Failed to submit review');
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
      const response = await fetch(`/api/reviews/seller/${sellerId}`);
      
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
          console.log('Found user ID from localStorage user object:', buyerId);
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
    
    console.log('getBuyerId result:', buyerId);
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
        console.log('Session data from API:', sessionData);
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
