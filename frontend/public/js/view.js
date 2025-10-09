const itemsPerPage = 6;
let allProducts = [];
let currentPage = 1;

const productList = document.getElementById('productList');
const searchInput = document.querySelector('.search__input');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageIndicator = document.getElementById('pageIndicator');

async function loadProducts(searchTerm = "", page = 1) {
  try {
    const response = await fetch('/products');
    const responseData = await response.json();
    
    // Handle new API response format
    const products = responseData.data || responseData;
    
    if (!Array.isArray(products)) {
      console.error("Products data is not an array:", products);
      productList.innerHTML = "<p>Error: Invalid products data format.</p>";
      return;
    }
    
    //  localStorage.setItem("products", JSON.stringify(products));

    const term = searchTerm.toLowerCase();
    allProducts = products.filter(product => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.location.toLowerCase().includes(term) ||
        (product.organicStatus && product.organicStatus.toLowerCase().includes(term))
      );
    });

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = allProducts.slice(start, end);

    productList.innerHTML = '';

    if (paginated.length === 0) {
      productList.innerHTML = `<p style="padding:20px;">No matching products found.</p>`;
      updatePaginationControls(page);
      return;
    }

    paginated.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.className = 'pro';

      // Check if product is on promotion and not expired
      const isPromotionActive = product.isOnPromotion && 
        (!product.promotionEndDate || new Date(product.promotionEndDate) > new Date());

      productDiv.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        ${isPromotionActive ? '<div class="promo-badge">PROMO</div>' : ''}
        <div class="des">
          <span class="category">${product.category}</span>
          <h5>${product.name}</h5>
          <h6><i class="fa fa-map-marker"></i> &#9658; ${product.location}</h6>
          <div class="price-container">
            ${isPromotionActive ? 
              `<h4 class="promo-price">K${product.promoPrice}</h4>
               <h4 class="original-price">K${product.price}</h4>` : 
              `<h4>K${product.price}</h4>`
            }
          </div>
          <div class="inventory-info">
            ${product.organicStatus ? `<span class="organic">${product.organicStatus}</span>` : ''}
          </div>
        </div>
        <div class="actions">
          <div class="edit-btn" onclick="editProduct('${product._id}')" title="Edit Product">
            <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
          </div>
          <div class="delete-btn" onclick="deleteProduct('${product._id}')" title="Delete Product">
            <i class="fa fa-trash" aria-hidden="true"></i>
          </div>
        </div>
      `;

      productList.appendChild(productDiv);
    });

    updatePaginationControls(page);
  } catch (err) {
    console.error("Error loading products:", err);
    productList.innerHTML = "<p>Error loading products.</p>";
  }
}

function updatePaginationControls(page) {
  pageIndicator.textContent = ` ${page}`;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page * itemsPerPage >= allProducts.length;
}

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadProducts(searchInput.value.trim(), currentPage);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentPage * itemsPerPage < allProducts.length) {
    currentPage++;
    loadProducts(searchInput.value.trim(), currentPage);
  }
});

searchInput.addEventListener('input', () => {
  currentPage = 1;
  loadProducts(searchInput.value.trim(), currentPage);
});

function editProduct(_id) {
  localStorage.setItem('editProductId', _id);
  window.location.href = '/add';
}

async function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/product/${id}`, { method: 'DELETE' });
    const msg = await res.text();
    alert(msg);
    loadProducts(searchInput.value.trim(), currentPage);
  } catch (err) {
    console.error("Failed to delete product:", err);
    alert("Error deleting product.");
  }
}

function updateStock(productId, productName, currentStock, currentUnit) {
  alert("Stock management feature is temporarily disabled. This will be implemented in a future update.");
  
}

// Seller Dashboard Functions
async function loadSellerStats() {
  try {
    // Get seller's products to count them
    const response = await fetch('/products');
    const responseData = await response.json();
    
    // Handle new API response format
    const products = responseData.data || responseData;
    
    if (!Array.isArray(products)) {
      console.error("Products data is not an array:", products);
      return;
    }
    
    // Count products
    const totalProducts = products.length;
    document.getElementById('totalProducts').textContent = totalProducts;
    
    // Get seller's reviews
    const sellerId = products[0]?.sellerId?._id || products[0]?.sellerId;
    console.log('Loading seller reviews for sellerId:', sellerId);
    console.log('Products data:', products[0]);
    
    if (sellerId) {
      try {
        console.log('Fetching reviews from:', `/api/reviews/seller/${sellerId}`);
        const reviewsResponse = await fetch(`/api/reviews/seller/${sellerId}`);
        
        console.log('Reviews response status:', reviewsResponse.status);
        console.log('Reviews response ok:', reviewsResponse.ok);
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          console.log('Reviews data received:', reviewsData);
          
          if (reviewsData.reviews && reviewsData.reviews.length > 0) {
            const totalReviews = reviewsData.reviews.length;
            const averageRating = reviewsData.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
            
            console.log('Calculated stats:', { totalReviews, averageRating });
            
            document.getElementById('totalReviews').textContent = totalReviews;
            document.getElementById('averageRating').textContent = averageRating.toFixed(1);
            
            // Display stars
            const starsContainer = document.getElementById('ratingStars');
            starsContainer.innerHTML = generateStarHtml(averageRating);
          } else {
            console.log('No reviews found for seller');
            document.getElementById('totalReviews').textContent = '0';
            document.getElementById('averageRating').textContent = '0.0';
            document.getElementById('ratingStars').innerHTML = generateStarHtml(0);
          }
        } else {
          console.warn('Failed to load seller reviews for stats:', reviewsResponse.status);
          const errorText = await reviewsResponse.text();
          console.warn('Error response:', errorText);
          document.getElementById('totalReviews').textContent = '0';
          document.getElementById('averageRating').textContent = '0.0';
          document.getElementById('ratingStars').innerHTML = generateStarHtml(0);
        }
      } catch (error) {
        console.error('Error loading seller reviews for stats:', error);
        document.getElementById('totalReviews').textContent = '0';
        document.getElementById('averageRating').textContent = '0.0';
        document.getElementById('ratingStars').innerHTML = generateStarHtml(0);
      }
    } else {
      console.warn('No sellerId found in products data');
    }
  } catch (error) {
    console.error('Error loading seller stats:', error);
  }
}

function generateStarHtml(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '<span class="star-display active">★</span>';
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars += '<span class="star-display half">★</span>';
    } else {
      stars += '<span class="star-display">★</span>';
    }
  }
  return stars;
}

function showReviews() {
  const reviewsSection = document.getElementById('reviewsSection');
  reviewsSection.style.display = 'block';
  loadSellerReviews();
}

function hideReviews() {
  const reviewsSection = document.getElementById('reviewsSection');
  reviewsSection.style.display = 'none';
}

async function loadSellerReviews() {
  try {
    const response = await fetch('/products');
    const responseData = await response.json();
    
    // Handle new API response format
    const products = responseData.data || responseData;
    
    if (!Array.isArray(products) || products.length === 0) {
      console.error("No products data available");
      return;
    }
    
    const sellerId = products[0]?.sellerId?._id || products[0]?.sellerId;
    if (sellerId) {
      const reviewsResponse = await fetch(`/api/reviews/seller/${sellerId}`);
      
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        displaySellerReviews(reviewsData.reviews || []);
      } else {
        console.warn('Failed to load seller reviews:', reviewsResponse.status, reviewsResponse.statusText);
        displaySellerReviews([]);
      }
    }
  } catch (error) {
    console.error('Error loading seller reviews:', error);
  }
}

function displaySellerReviews(reviews) {
  const reviewsContainer = document.getElementById('sellerReviews');
  
  if (reviews.length === 0) {
    reviewsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No reviews yet</p>';
    return;
  }
  
  const reviewsHtml = reviews.map(review => `
    <div class="review-item">
      <div class="review-header">
        <div class="reviewer-info">
          <strong>${review.buyerId?.username || 'Anonymous'}</strong>
          <div class="rating-stars-display">
            ${generateStarHtml(review.rating)}
          </div>
        </div>
        <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
      <h5 class="review-experience">Experience: ${review.experience ? review.experience.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}</h5>
      <p class="review-comment">${review.comment}</p>
      <div class="review-product">
        <small>Product: ${review.productId?.name || 'Unknown Product'}</small>
      </div>
    </div>
  `).join('');
  
  reviewsContainer.innerHTML = reviewsHtml;
}

function showOrders() {
  // Redirect to order management or show orders
  window.location.href = '/request';
}


// Load products initially
loadProducts();
loadSellerStats();