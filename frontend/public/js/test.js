  let unitPrice = 0;
  let totalPrice = 0;
  let productName = '';
  let productImage = '';
  let productSeller = '';
  let buyerId = '';
  let seller_Id = '';
  let unit = '';
  let availability = 'Available';
  let quantity = 1;


document.addEventListener("DOMContentLoaded", () => {
  const productId = localStorage.getItem('selectedProductId');
   
  const today = new Date().toISOString().split("T")[0];
  document.querySelector('input[type="date"]').setAttribute("min", today);

  if (!productId) {
    document.querySelector('#temporaryContent').innerHTML = "<p>No product selected.</p>";
    return;
  }

  fetch('/products')
    .then(res => res.json())
    .then(responseData => {
      // Handle new API response format
      const products = responseData.data || responseData;
      
      if (!Array.isArray(products)) {
        console.error("Products data is not an array:", products);
        document.querySelector('#temporaryContent').innerHTML = "<p>Error: Invalid products data format.</p>";
        return;
      }
      
      const product = products.find(p => p._id == productId);
      console.log("product data",product)
      if (product) {
  // Check if product is on promotion and not expired
  const isPromotionActive = product.isOnPromotion && 
    (!product.promotionEndDate || new Date(product.promotionEndDate) > new Date());
  
  unitPrice = isPromotionActive ? product.promoPrice : product.price;
  availability = product.availability || 'Available';    
  productName = product.name;
  productImage = product.image;
  productSeller = product.sellerId?.username || 'Unknown';
  seller_Id = product.sellerId?._id || product.sellerId || null;
  unit = product.unit || "";
        document.querySelector('.title').textContent = product.name;
        document.querySelector('.type-Product').textContent = product.organicStatus || "";
        document.querySelector('.image-container img').src = product.image;
        document.querySelector('.scale').textContent = `${product.unit || "N/A"}`;
        
        // Display pricing with promotion support
        const priceLabel = document.querySelector('.price-lable');
        if (isPromotionActive) {
          priceLabel.innerHTML = `
            <span class="promo-price">K${product.promoPrice}</span>
            <span class="original-price">K${product.price}</span>
          `;
        } else {
          priceLabel.textContent = `K${product.price}`;
        }
        const descEl = document.querySelector('.description');
        const locationParts = product.location ? product.location.split(',') : ["", ""];
        const province = locationParts[0]?.trim() || "N/A";

        descEl.innerHTML = `
          <p><span>Category:</span> ${product.category || "N/A"}</p>
          <p class="organic"><i class="fa fa-pagelines" aria-hidden="true"></i>  ${product.organicStatus || 'N/A'}</p>
          <p><span>Unit:</span> ${product.unit || 'N/A'}</p>
          <p class="location"><i class="fa fa-map-marker" aria-hidden="true"></i>  ${product.location || 'N/A'}, ${province}</p>
          <p><span>Description:</span> ${product.description || "No description available"}</p>
          <p class="seller"><i class="fa fa-user" aria-hidden="true"></i>   ${product.sellerId?.username || 'Unknown'}</p>
          <p class="availability">Product: ${product.availability|| 'Available'}</p>
        `;

        updateFinalPrice(); // Set initial final price
        
        // Set up messaging functionality after product data is loaded
        setTimeout(() => {
          setupMessagingFunctionality(product);
          loadProductReviews(product._id);
          
          // Set global variables for review functionality
          if (typeof currentProductId !== 'undefined') {
            currentProductId = product._id;
          }
          if (typeof currentSellerId !== 'undefined') {
            currentSellerId = product.sellerId;
          }
          
          // Toggle write review button
          if (typeof toggleWriteReviewButton !== 'undefined') {
            toggleWriteReviewButton();
          }
        }, 500);
      } else {
        document.querySelector('#temporaryContent').innerHTML = "<p>Product not found.</p>";
      }
    })
    .catch(err => {
      console.error("Error fetching product details:", err);
      document.querySelector('#temporaryContent').innerHTML = "<p>Error loading product.</p>";
    });

  // Quantity and final price handling
  const plus = document.querySelector('.plus'),
        minus = document.querySelector('.minus'),
        num = document.querySelector('.num'),
        finalPriceEl = document.getElementById('finalPrice');

  let a = 1;
  plus.addEventListener('click', () => {
  a++;
  num.innerText = (a < 10) ? '0' + a : a;
  updateFinalPrice();
});

minus.addEventListener('click', () => {
  if (a > 1) {
    a--;
    num.innerText = (a < 10) ? '0' + a : a;
    updateFinalPrice();
  }
});




function updateFinalPrice() {
  if (finalPriceEl) {
    totalPrice = unitPrice * a; // Save total price
    finalPriceEl.textContent = totalPrice.toLocaleString(); 
  }
}

// Function to set up messaging functionality with product data
function setupMessagingFunctionality(product) {
  console.log('Setting up messaging functionality with product:', product);
  
  const messageSupplierBtn = document.getElementById('messageSupplierBtn');
  console.log('Message Supplier button found:', !!messageSupplierBtn);
  
  if (messageSupplierBtn) {
    // Remove any existing event listeners
    messageSupplierBtn.replaceWith(messageSupplierBtn.cloneNode(true));
    const newMessageBtn = document.getElementById('messageSupplierBtn');
    console.log('New message button created:', !!newMessageBtn);
    
    newMessageBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('Message Supplier button clicked!');
      
      // Get product data
      const productId = product._id;
      const sellerId = product.sellerId?._id || product.sellerId;
      const productName = product.name;
      const productPrice = product.price;
      
      console.log('Messaging with:', { productId, sellerId, productName, productPrice });
      
      if (productId && sellerId && productName) {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        console.log('Current user:', user);
        
        if (!user) {
          alert('Please log in to send messages');
          window.location.href = '/login';
          return;
        }
        
        // Validate user data format
        const userId = user._id || user.id;
        if (!userId) {
          console.error('User ID not found in user data:', user);
          alert('User session invalid. Please log in again.');
          window.location.href = '/login';
          return;
        }
        
        console.log('Using user ID:', userId, 'Seller ID:', sellerId);
        
        // Check if user is trying to message themselves
        if (userId === sellerId) {
          alert('You cannot message yourself');
          return;
        }
        
        try {
          // Create or get conversation
          const conversationResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              buyerId: userId,
              sellerId: sellerId,
              productId: productId
            })
          });

          if (!conversationResponse.ok) {
            const errorData = await conversationResponse.json().catch(() => ({}));
            console.error('Conversation creation failed:', {
              status: conversationResponse.status,
              statusText: conversationResponse.statusText,
              error: errorData.message || 'Unknown error'
            });
            throw new Error(`Failed to create conversation: ${errorData.message || conversationResponse.statusText}`);
          }

          const responseData = await conversationResponse.json();
          
          // Handle new API response format
          const conversationData = responseData.data || responseData;
          
          console.log('Conversation created/retrieved:', conversationData);
          
          // Extract conversation ID and new conversation flag
          const conversationId = conversationData.conversation?._id || conversationData.conversationId;
          const isNewConversation = conversationData.isNewConversation || false;
          
          if (!conversationId) {
            throw new Error('No conversation ID returned from server');
          }
          
          console.log('Conversation ID:', conversationId);
          console.log('Is new conversation:', isNewConversation);

          // If conversation was just created, send an initial message
          if (isNewConversation) {
            console.log('Sending initial message to new conversation');
            
            const initialMessageResponse = await fetch('/api/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                conversationId: conversationId,
                message: `Hello! I'm very interested in your product "${productName}" (K${productPrice}). 

I'd love to learn more about:
• Product specifications
• Availability and quantity
• Delivery options
• Any special offers

Please let me know when you're available to discuss. Thank you!`
              })
            });

            if (initialMessageResponse.ok) {
              console.log('Initial message sent successfully');
            } else {
              console.error('Failed to send initial message');
            }
          }

          // Store conversation info for messaging dashboard
          localStorage.setItem('pendingConversationId', conversationId);
          console.log('Stored pendingConversationId in localStorage:', conversationId);
          
          // Show appropriate notification
          if (isNewConversation) {
            alert('Starting new conversation with supplier...');
          } else {
            alert('Opening existing conversation...');
          }
          
          // Redirect to messaging dashboard
          window.location.href = '/messaging';
          
        } catch (error) {
          console.error('Error creating conversation:', error);
          alert('Failed to start conversation. Please try again.');
        }
      } else {
        console.error('Missing product data for messaging:', { productId, sellerId, productName });
        alert('Product information is not available for messaging.');
      }
    });
    
    console.log('Messaging functionality set up successfully');
  } else {
    console.error('Message Supplier button not found in DOM');
  }
}

});

document.querySelector(".order").addEventListener("click", async (e) => {

    const user = JSON.parse(localStorage.getItem('user'));
  let userId = user ? (user._id || user.id) : null;
  let userName = user ? user.username : null;
    const productId = localStorage.getItem('selectedProductId');
  

  const quantity = parseInt(document.querySelector(".num").textContent);
  const deliveryDate = document.querySelector('input[type="date"]').value;
  console.log("seller_Id",seller_Id)
  if (!deliveryDate) return alert("Please select a delivery date");

  try {
    const response = await fetch("/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        availability,
        deliveryDate,
        totalPrice,
        productName,
        quantity,
        unit,
        productImage,
        sellerName: productSeller,
        userId,
        userName,
        sellerId: seller_Id
      })
    });


    const data = await response.json();

    if (response.ok) {
      alert("Order added successfully!");
      window.location.href = "/orderTable"; // redirect to order table
    } else {
      alert(data.message || data.error);
    }
  } catch (err) {
    console.error(err);
    alert("Error creating order");
  }
});

// Product Reviews System
let currentReviewsPage = 1;
const reviewsPerPage = 5;

async function loadProductReviews(productId, page = 1) {
  try {
    console.log('Loading reviews for product:', productId);
    
    const response = await fetch(`/api/reviews/product/${productId}?page=${page}&limit=${reviewsPerPage}`);
    
    if (!response.ok) {
      throw new Error('Failed to load reviews');
    }
    
    const responseData = await response.json();
    const reviewsData = responseData.data || responseData;
    
    console.log('Reviews data:', reviewsData);
    
    displayReviews(reviewsData);
    updateReviewsSummary(reviewsData);
    setupReviewsPagination(reviewsData);
    
  } catch (error) {
    console.error('Error loading reviews:', error);
    document.getElementById('reviewsContainer').innerHTML = 
      '<div class="no-reviews">Unable to load reviews at this time.</div>';
  }
}

function displayReviews(reviewsData) {
  const container = document.getElementById('reviewsContainer');
  const reviews = reviewsData.reviews || reviewsData;
  
  if (!reviews || reviews.length === 0) {
    container.innerHTML = `
      <div class="no-reviews">
        <i class="fa fa-comment-o" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
        <p>No reviews yet for this product.</p>
        <p style="color: #888; font-size: 14px;">Be the first to share your experience!</p>
      </div>
    `;
    return;
  }
  
  // Store all reviews globally for view more functionality
  window.allReviews = reviews;
  window.showingAllReviews = false;
  
  // Show only first 3 reviews initially
  const initialReviews = reviews.slice(0, 3);
  const hasMoreReviews = reviews.length > 3;
  
  const reviewsHTML = initialReviews.map(review => createReviewHTML(review)).join('');
  
  // Add view more button if there are more than 3 reviews
  const viewMoreButton = hasMoreReviews ? `
    <div class="view-more-reviews">
      <button class="view-more-btn" onclick="toggleAllReviews()">
        <i class="fa fa-chevron-down"></i>
        View More Reviews (${reviews.length - 3} more)
      </button>
    </div>
  ` : '';
  
  container.innerHTML = reviewsHTML + viewMoreButton;
  
  // Add collapsed class when showing only 3 reviews
  if (hasMoreReviews) {
    container.classList.add('collapsed');
  }
}

function createReviewHTML(review) {
  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit'
  });
  
  const buyerName = review.buyerId?.username || 'Anonymous Buyer';
  const buyerInitial = buyerName.charAt(0).toUpperCase();
  
  const starsHTML = generateStarsHTML(review.rating);
  
  return `
    <div class="review-item">
      <div class="review-header">
        <div class="reviewer-info">
          <div class="reviewer-avatar">${buyerInitial}</div>
          <div class="reviewer-details">
            <h4>${escapeHtml(buyerName)}</h4>
            ${review.isVerified ? '<div class="verified"><i class="fa fa-check-circle"></i> Verified</div>' : ''}
          </div>
        </div>
        <div class="review-rating">
          <div class="review-stars">${starsHTML}</div>
          <span class="review-date">${reviewDate}</span>
          <span class="review-experience ${review.experience}">${review.experience.replace('-', ' ')}</span>
        </div>
      </div>
      
      ${review.title ? `<div class="review-title">${escapeHtml(review.title)}</div>` : ''}
      
      <div class="review-comment">${escapeHtml(review.comment)}</div>
      
      <div class="review-footer">
        <div class="review-helpful">
          <i class="fa fa-thumbs-up"></i>
          <span>Helpful (${review.helpfulVotes || 0})</span>
        </div>
      </div>
    </div>
  `;
}

function toggleAllReviews() {
  const container = document.getElementById('reviewsContainer');
  const viewMoreBtn = container.querySelector('.view-more-btn');
  
  // Add loading state
  if (viewMoreBtn) {
    viewMoreBtn.classList.add('loading');
    viewMoreBtn.disabled = true;
  }
  
  // Simulate a brief loading delay for better UX
  setTimeout(() => {
    if (!window.showingAllReviews) {
      // Show all reviews
      const allReviewsHTML = window.allReviews.map(review => createReviewHTML(review)).join('');
      const viewLessButton = `
        <div class="view-more-reviews">
          <button class="view-more-btn" onclick="toggleAllReviews()">
            <i class="fa fa-chevron-up"></i>
            View Less Reviews
          </button>
        </div>
      `;
      
      container.innerHTML = allReviewsHTML + viewLessButton;
      container.classList.remove('collapsed');
      window.showingAllReviews = true;
      
      // Smooth scroll to the button after expanding
      setTimeout(() => {
        const button = container.querySelector('.view-more-btn');
        if (button) {
          button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } else {
      // Show only first 3 reviews
      const initialReviews = window.allReviews.slice(0, 3);
      const reviewsHTML = initialReviews.map(review => createReviewHTML(review)).join('');
      const viewMoreButton = `
        <div class="view-more-reviews">
          <button class="view-more-btn" onclick="toggleAllReviews()">
            <i class="fa fa-chevron-down"></i>
            View More Reviews (${window.allReviews.length - 3} more)
          </button>
        </div>
      `;
      
      container.innerHTML = reviewsHTML + viewMoreButton;
      container.classList.add('collapsed');
      window.showingAllReviews = false;
    }
  }, 200);
}

function updateReviewsSummary(reviewsData) {
  const summaryElement = document.getElementById('reviewsSummary');
  const totalReviews = reviewsData.totalReviews || reviewsData.total || 0;
  const averageRating = reviewsData.averageRating || reviewsData.avgRating || 0;
  
  const starsHTML = generateStarsHTML(averageRating);
  
  summaryElement.innerHTML = `
    <div class="average-rating">
      <span class="rating-number">${averageRating.toFixed(1)}</span>
      <div class="stars-display">${starsHTML}</div>
      <span class="total-reviews">(${totalReviews} review${totalReviews !== 1 ? 's' : ''})</span>
    </div>
  `;
}

function setupReviewsPagination(reviewsData) {
  const paginationElement = document.getElementById('reviewsPagination');
  const totalPages = reviewsData.totalPages || Math.ceil((reviewsData.total || 0) / reviewsPerPage);
  const currentPage = reviewsData.currentPage || currentReviewsPage;
  
  if (totalPages <= 1) {
    paginationElement.style.display = 'none';
    return;
  }
  
  paginationElement.style.display = 'flex';
  
  const prevButton = document.getElementById('prevReviews');
  const nextButton = document.getElementById('nextReviews');
  const pageInfo = paginationElement.querySelector('.reviews-page-info');
  
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
  
  // Remove existing event listeners
  prevButton.replaceWith(prevButton.cloneNode(true));
  nextButton.replaceWith(nextButton.cloneNode(true));
  
  // Add new event listeners
  document.getElementById('prevReviews').addEventListener('click', () => {
    if (currentReviewsPage > 1) {
      currentReviewsPage--;
      const productId = localStorage.getItem('selectedProductId');
      loadProductReviews(productId, currentReviewsPage);
    }
  });
  
  document.getElementById('nextReviews').addEventListener('click', () => {
    if (currentReviewsPage < totalPages) {
      currentReviewsPage++;
      const productId = localStorage.getItem('selectedProductId');
      loadProductReviews(productId, currentReviewsPage);
    }
  });
}

function generateStarsHTML(rating) {
  let starsHTML = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsHTML += '<span class="star filled">★</span>';
    } else if (i === fullStars + 1 && hasHalfStar) {
      starsHTML += '<span class="star filled">☆</span>'; // Half star
    } else {
      starsHTML += '<span class="star">☆</span>';
    }
  }
  
  return starsHTML;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

