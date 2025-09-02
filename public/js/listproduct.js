document.addEventListener('DOMContentLoaded', async () => {
  const productList = document.getElementById('productList');
  const searchInput = document.querySelector('.search__input');
  const paginationContainer = document.createElement('div');
  paginationContainer.id = 'pagination';
  paginationContainer.className = 'pagination';
  productList.parentElement.appendChild(paginationContainer);

  const PRODUCTS_PER_PAGE = 6;
  let currentPage = 1;
  let filteredProducts = [];

  console.log("product data",productList)

  async function loadProducts(searchTerm = "") {
    try {
      const response = await fetch('/products');
      if (!response.ok) throw new Error("Unauthorized or error");
      const products = await response.json();

      const term = searchTerm.toLowerCase();
      filteredProducts = products.filter(product => {
        return (
          product.name.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.location.toLowerCase().includes(term) ||
          (product.organicStatus && product.organicStatus.toLowerCase().includes(term))
        );
      });

      currentPage = 1;
      renderProducts();
      setupPagination();
    } catch (err) {
      console.error("Error loading products:", err);
      productList.innerHTML = "<p>Error loading products. Please make sure you are logged in as a buyer.</p>";
    }
  }

  function renderProducts() {
    productList.innerHTML = '';
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    const currentItems = filteredProducts.slice(start, end);

    if (currentItems.length === 0) {
      productList.innerHTML = `<p style="padding:20px;">No matching products found.</p>`;
      return;
    }

    currentItems.forEach(product => {
      productList.innerHTML += `
        <div class="pro" onclick="viewProduct('${product._id}')">
          <div class="image-box">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div class="des">
            <span class="category">${product.category}</span>
            <h5>${product.name}</h5>
            <h4>K${product.price}</h4>
          </div>
          <a href="/productDetail" onclick='localStorage.setItem("selectedProductId", "${product._id}")'>
            <i class="fa fa-shopping-cart cart" aria-hidden="true"></i>
          </a>
        </div>
      `;
    });
  }

                // <p class="seller">Seller: ${product.sellerId?.username || 'Unknown'}</p>

  function setupPagination() {
    paginationContainer.innerHTML = "";
    const pageCount = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

    for (let i = 1; i <= pageCount; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = "page-btn";
      if (i === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = i;
        renderProducts();
        setupPagination();
      });
      paginationContainer.appendChild(btn);
    }
  }

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim();
    loadProducts(searchTerm);
  });

  loadProducts(); // Initial load
});
