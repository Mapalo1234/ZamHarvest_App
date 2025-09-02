const darkBg = document.querySelector('.dark_bg'),
  popupForm = document.querySelector('.popup'),
  closeBtn = document.querySelector('.closeBtn'),
  submitBtn = document.querySelector('.submitBtn'),
  modalTitle = document.querySelector('.modalTitle'),
  popupFooter = document.querySelector('.popupFooter'),
  imgInput = document.querySelector('.img'),
  imgHolder = document.querySelector('.imgholder'),
  entries = document.querySelector(".showEntries"),
  orderInfo = document.querySelector(".orderInfo"),
  form = document.querySelector('form'),
  formInputFields = document.querySelectorAll('form input, form select');

let getData = [];
let isEdit = false, editId;
let arrayLength = 0, tableSize = 4, startIndex = 1, endIndex = 0, currentIndex = 1, maxIndex = 0; // <- tableSize 4
let BuyerId = "";

// ------------------ Fetch Orders from Server ------------------ //
async function fetchOrders() {
    const user = JSON.parse(localStorage.getItem('user'));
    let userId = user ? user.id : null;
    BuyerId = userId;

    if (!BuyerId) {
        console.error("No logged-in user found.");
        return;
    }

    try {
        const res = await fetch(`/orders/${BuyerId}`);
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        // Ensure orders exist
        if (!data.orders || !Array.isArray(data.orders)) {
            console.error("No orders found in response");
            return;
        }

        // Map orders to your format
        getData = data.orders.map(order => ({
            id: order._id, // or order.orderId if you have a custom field
            picture: order.productId?.image || "default.png",
            productName: order.productId?.name || "Unknown Product",
            totalPrice: order.totalPrice,
            quantity: order.quantity || 1,
            seller: order.sellerName || "Unknown Seller",
            paidStatus: order.paidStatus
        }));

        preLoadCalculations();
        displayIndexBtn();
        highlightIndexBtn();
    } catch (err) {
        console.error("Failed to load orders:", err);
    }
}

// Call when page loads
fetchOrders();

// ------------------ Pagination & Display Logic ------------------ //
function preLoadCalculations() {
  arrayLength = getData.length;
  maxIndex = Math.ceil(arrayLength / tableSize);
  if (maxIndex === 0) maxIndex = 1; // guard
  if (currentIndex > maxIndex) currentIndex = maxIndex; // keep in range
}

function displayIndexBtn() {
  preLoadCalculations();
  const pagination = document.querySelector('.pagination');
  pagination.innerHTML = `<button onclick="prev()" class="prev"></button>`;
  for (let i = 1; i <= maxIndex; i++) {
    pagination.innerHTML += `<button onclick="paginationBtn(${i})" index="${i}">${i}</button>`;
  }
  pagination.innerHTML += `<button onclick="next()" class="next"></button>`;
  highlightIndexBtn();
}

function highlightIndexBtn() {
  preLoadCalculations();

  startIndex = ((currentIndex - 1) * tableSize) + 1;
  endIndex = (startIndex + tableSize) - 1;
  if (endIndex > arrayLength) endIndex = arrayLength;

  entries.textContent = `Showing ${endIndex} of ${arrayLength} orders`;

  document.querySelectorAll('.pagination button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('index') === currentIndex.toString()) btn.classList.add('active');
  });

  showInfo();
}

function showInfo() {
  document.querySelectorAll(".orderDetails").forEach(info => info.remove());
  let tab_start = startIndex - 1, tab_end = endIndex; // tab_end is exclusive in loop below

  if (getData.length > 0) {
    for (let i = tab_start; i < tab_end; i++) {
      let order = getData[i];
      if (order) {
        let row = `<tr class="orderDetails">
          <td><img src="${order.picture}" alt="" width="40" height="40"></td>
          <td>${order.productName}</td>
          <td>${order.totalPrice}</td>
          <td>${order.quantity}</td>
          <td>${order.sellerName || "Unknown Seller"}</td>
          <td>${order.paidStatus}</td>
          <td>
            <button onclick="readInfo('${order.picture}','${order.productName}','${order.totalPrice}','${order.quantity}','${order.sellerName}','${order.paidStatus}')"><i class="fa-regular fa-eye"></i></button>
            <button onclick="deleteInfo('${order.id}', ${i})"><i class="fa-regular fa-trash-can"></i></button>
            <button onclick="#"><i class="fa fa-shopping-cart" aria-hidden="true"></i></button>
          </td>
        </tr>`;
        orderInfo.innerHTML += row;
      }
    }
  } else {
    orderInfo.innerHTML = `<tr class="orderDetails"><td colspan="7" align="center">No data available in table</td></tr>`;
  }
}

// ------------------ Popup Logic ------------------ //
function readInfo(pic, pName, tPrice, quantity, sName, pStatus) {
  imgInput.src = pic;
  form.querySelector("#productName").value = pName;
  form.querySelector("#totalPrice").value = tPrice;
  form.querySelector("#quantity").value = quantity;
  form.querySelector("#seller").value = sName;
  form.querySelector("#paidStatus").value = pStatus;

  darkBg.classList.add('active');
  popupForm.classList.add('active');
  popupFooter.style.display = "none";
  modalTitle.innerHTML = "Order Details";

  formInputFields.forEach(input => input.disabled = true);
  imgHolder.style.pointerEvents = "none";
}

closeBtn.addEventListener('click', () => {
  darkBg.classList.remove('active');
  popupForm.classList.remove('active');
  form.reset();
});

// ------------------ Pagination Buttons ------------------ //
function next() { if (currentIndex < maxIndex) { currentIndex++; highlightIndexBtn(); } }
function prev() { if (currentIndex > 1) { currentIndex--; highlightIndexBtn(); } }
function paginationBtn(i) { currentIndex = i; highlightIndexBtn(); }

// ------------------ Delete Function ------------------ //
async function deleteInfo(orderId, index) {
  if (confirm("Are you sure you want to delete this order?")) {
    try {
      const response = await fetch(`/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from getData
        getData.splice(index, 1);

        preLoadCalculations();

        if (getData.length === 0) {
          currentIndex = 1;
          startIndex = 1;
          endIndex = 0;
        } else if (currentIndex > maxIndex) {
          currentIndex = maxIndex;
        }

        displayIndexBtn();
        highlightIndexBtn();
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Something went wrong. Try again.");
    }
  }
}
