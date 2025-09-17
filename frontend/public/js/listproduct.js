document.addEventListener("DOMContentLoaded", async () => {
  const tabButtons = document.querySelectorAll(".tab_btn");
  const productList = document.getElementById("productList");
  const searchInput = document.querySelector(".search__input");
  const paginationContainer = document.createElement("div");
  paginationContainer.id = "pagination";
  paginationContainer.className = "pagination";
  productList.parentElement.appendChild(paginationContainer);

  // ✅ Moving underline line
  const line = document.querySelector(".line");

  function moveLine(activeTab) {
    if (!line || !activeTab) return;
    line.style.width = `${activeTab.offsetWidth}px`;
    line.style.left = `${activeTab.offsetLeft}px`;
  }

  // Initial line setup
  const activeTab = document.querySelector(".tab_btn.active") || tabButtons[0];
  if (activeTab) moveLine(activeTab);

  tabButtons.forEach(tab => {
    tab.addEventListener("click", function () {
      tabButtons.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      moveLine(tab);
    });
  });

  // ✅ Pagination + product filtering
  const PRODUCTS_PER_PAGE = 6;
  let currentPage = 1;
  let allProducts = [];
  let filteredProducts = [];

  const CATEGORY_MAP = {
    fruits: ["fruit", "fruits"],
    vegetables: ["vegetable", "vegetables"],
    meat: ["meat", "beef", "chicken"],
  };

  function normalizeCategoryValue(val) {
    return (val || "").toString().trim().toLowerCase();
  }

  function filterByCategory(categoryId) {
    if (!categoryId || categoryId === "tab1" || categoryId === "all") {
      return allProducts.slice();
    }

    const matchList = CATEGORY_MAP[categoryId] || [categoryId.toLowerCase()];
    return allProducts.filter(p => {
      const catVal = normalizeCategoryValue(p.category);
      return matchList.some(m => catVal.includes(m));
    });
  }

  async function loadProducts(searchTerm = "", categoryId = "all") {
    try {
      const response = await fetch("/products");
      if (!response.ok) throw new Error("Unauthorized or error");
      allProducts = await response.json();

      const term = searchTerm.toLowerCase();

      let productsToFilter = filterByCategory(categoryId);

      filteredProducts = productsToFilter.filter(product => {
        return (
          product.unit.toLowerCase().includes(term) ||
          product.name.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.location.toLowerCase().includes(term) ||
          (product.organicStatus &&
            product.organicStatus.toLowerCase().includes(term))
        );
      });

      currentPage = 1;
      renderProducts();
      setupPagination();
    } catch (err) {
      console.error("Error loading products:", err);
      productList.innerHTML =
        "<p>Error loading products. Please make sure you are logged in as a buyer.</p>";
    }
  }

  function renderProducts() {
    productList.innerHTML = "";
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    const currentItems = filteredProducts.slice(start, end);

    if (currentItems.length === 0) {
      productList.innerHTML = `
      <div style="text-align:center; padding:40px; color:#555;">
        <img src="/image/icons8-empty-box-100.png" 
             alt="No results" 
             style="width:100px; height:100px; opacity:0.7; margin-bottom:15px;">
        <p>No matching products found.</p>
      </div>
    `;
    return;
    }

    currentItems.forEach(product => {
      productList.innerHTML += `
        <div class="pro" onclick="viewProduct('${product._id}')">
          <div class="image-box">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div class="des">
           <p class="${product.availability === 'Available' ? 'available' : 'unavailable'}">
              ${product.availability}
          </p>
            <span class="category">${product.category}</span>
            <h5>${product.name}</h5>
            <h4>K${product.price} | ${product.unit}</h4>
          </div>
          <a href="/productDetail" onclick='localStorage.setItem("selectedProductId", "${product._id}")'>
            <i class="fa fa-shopping-cart cart" aria-hidden="true"></i>
          </a>
        </div>
      `;
    });
  }

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

  // ✅ Tab click handling with product loading
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      moveLine(btn);
      const categoryId = btn.id;
      loadProducts(searchInput.value.trim(), categoryId);
    });
  });

  // ✅ Search handling
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.trim();
    const activeTab = document.querySelector(".tab_btn.active")?.id || "all";
    loadProducts(searchTerm, activeTab);
  });

  loadProducts(); // Initial load
});
