  let unitPrice = 0;
  let totalPrice = 0;
  let productName = '';
  let productImage = '';
  let productSeller = '';
  let buyerId = '';
  let seller_Id = '';
  let unit = '';
  
document.addEventListener("DOMContentLoaded", () => {
  const productId = localStorage.getItem('selectedProductId');


  if (!productId) {
    document.querySelector('#temporaryContent').innerHTML = "<p>No product selected.</p>";
    return;
  }

  fetch('/products')
    .then(res => res.json())
    .then(products => {
      const product = products.find(p => p._id == productId);
      console.log("product data",product)
      if (product) {
  unitPrice = product.price;
        
  productName = product.name;
  productImage = product.image;
  productSeller = product.sellerId?.username || 'Unknown';
  seller_Id = product.sellerId?._id || product.sellerId || null;
  unit = product.unit || "";
        document.querySelector('.title').textContent = product.name;
        document.querySelector('.type-Product').textContent = product.organic || "";
        document.querySelector('.image-container img').src = product.image;
        document.querySelector('.scale').textContent = `${product.unit || "N/A"}`;
        document.querySelector('.price-lable').textContent = `K${product.price}`;

        const descEl = document.querySelector('.description');
        const locationParts = product.location ? product.location.split(',') : ["", ""];
        const province = locationParts[0]?.trim() || "N/A";
        const town = locationParts[1]?.trim() || "N/A";

        descEl.innerHTML = `
          <p><span>Category:</span> ${product.category || "N/A"}</p>
          <p class="organic">Organic: ${product.organicStatus || 'N/A'}</p>
          <p><span>Province:</span> ${province}</p>
          <p><span>Town:</span> ${town}</p>
          <p><span>Unit:</span> ${product.unit || 'N/A'}</p>
          <p class="location">Town: ${product.location || 'N/A'}</p>
          <p><span>Description:</span> ${product.description || "No description available"}</p>
          <p class="seller">Seller: ${product.sellerId?.username || 'Unknown'}</p>
        `;

        updateFinalPrice(); // Set initial final price
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

});

document.querySelector(".order").addEventListener("click", async (e) => {

    const user = JSON.parse(localStorage.getItem('user'));
  let userId = user ? user.id : null;
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
        quantity,
        deliveryDate,
        totalPrice,
        productName,
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

