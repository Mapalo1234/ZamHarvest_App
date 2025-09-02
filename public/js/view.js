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
    const products = await response.json();

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

      productDiv.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="des">
          <span class="category">${product.category}</span>
          <h5>${product.name}</h5>
          <h6><i class="fa fa-map-marker"></i> &#9658; ${product.location}</h6>
          <h4>K${product.price}</h4>
        </div>
        <div class="actions">
          <div class="edit-btn" onclick="editProduct('${product._id}')"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></div>
          <div class="delete-btn" onclick="deleteProduct('${product._id}')"><i class="fa fa-trash" aria-hidden="true"></i></div>
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
  pageIndicator.textContent = `Page ${page}`;
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

function editProduct(id) {
  localStorage.setItem('editProductId', id);
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

// Load products initially
loadProducts();
