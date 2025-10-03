class ReviewSystem {
  constructor() {
    this.currentOrderId = null;
    this.currentSellerId = null;
    this.currentProductId = null;
  }

  // Initialize review system
  init() {
    this.loadReviewableOrders();
    this.setupEventListeners();
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

    try {
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: this.currentOrderId,
          rating,
          comment,
          experience
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review submitted successfully!');
        this.closeReviewForm();
        this.loadReviewableOrders(); // Refresh the list
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
      const data = await response.json();

      if (data.reviews) {
        this.displaySellerReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error loading seller reviews:', error);
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
}

// Initialize review system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.reviewSystem = new ReviewSystem();
  window.reviewSystem.init();
});
