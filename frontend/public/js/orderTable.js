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
let arrayLength = 0, tableSize = 4, startIndex = 1, endIndex = 0, currentIndex = 1, maxIndex = 0;
let BuyerId = "";
let sellerName = "";

// ------------------ Fetch Orders ------------------ //
async function fetchOrders() {
    const user = JSON.parse(localStorage.getItem('user'));
    BuyerId = user ? user.id : null;

    if (!BuyerId) {
        console.error("No logged-in user found.");
        return;
    }

    try {
        const res = await fetch(`/orders/${BuyerId}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        if (!data.orders || !Array.isArray(data.orders)) {
            console.error("No orders found in response");
            return;
        }

        getData = data.orders.map(order => ({
            id: order._id,
            picture: order.productImage || "default.png",
            productName: order.productName || "Unknown Product",
            totalPrice: order.totalPrice,
            quantity: order.quantity || 1,
            sellerName: order.sellerName || "Unknown Seller",
            paidStatus: order.paidStatus
        }));

        console.log("Fetched Orders:", getData);

        preLoadCalculations();
        displayIndexBtn();
        highlightIndexBtn();
    } catch (err) {
        console.error("Failed to load orders:", err);
    }
}

fetchOrders();

// ------------------ Pagination ------------------ //
function preLoadCalculations() {
    arrayLength = getData.length;
    maxIndex = Math.ceil(arrayLength / tableSize) || 1;
    if (currentIndex > maxIndex) currentIndex = maxIndex;
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
    endIndex = Math.min(startIndex + tableSize - 1, arrayLength);
    entries.textContent = `Showing ${endIndex} of ${arrayLength} orders`;

    document.querySelectorAll('.pagination button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('index') === currentIndex.toString()) btn.classList.add('active');
    });

    showInfo();
}

function next() { if (currentIndex < maxIndex) { currentIndex++; highlightIndexBtn(); } }
function prev() { if (currentIndex > 1) { currentIndex--; highlightIndexBtn(); } }
function paginationBtn(i) { currentIndex = i; highlightIndexBtn(); }

// ------------------ Display Orders ------------------ //
function showInfo() {
    document.querySelectorAll(".orderDetails").forEach(info => info.remove());
    let tab_start = startIndex - 1, tab_end = endIndex;

    if (getData.length > 0) {
        for (let i = tab_start; i < tab_end; i++) {
            const order = getData[i];
            if (order) {
                let row = `<tr class="orderDetails" data-id="${order.id}">
                    <td><img src="${order.picture}" alt="" width="40" height="40"></td>
                    <td>${order.productName}</td>
                    <td>k ${order.totalPrice}</td>
                    <td>${order.quantity}</td>
                    <td>${order.unit || "Unknown Unit"}</td>
                    <td>${order.sellerName || "Unknown Seller"}</td>
                    <td>${order.paidStatus}</td>
                    <td>
                        <button onclick="readInfo('${order.picture}','${order.productName}','${order.totalPrice}','${order.quantity}','${order.sellerName}','${order.unit}')"><i class="fa-regular fa-eye"></i></button>
                        <button onclick="deleteInfo('${order.id}', ${i})"><i class="fa-regular fa-trash-can"></i></button>
                        <button class="purchase-btn"><i class="fa fa-shopping-cart" aria-hidden="true"></i></button>
                    </td>
                </tr>`;
                orderInfo.innerHTML += row;
            }
        }
    } else {
        orderInfo.innerHTML = `<tr class="orderDetails"><td colspan="7" align="center">No data available in table</td></tr>`;
    }

    attachPurchaseEvents();
}

// ------------------ Delete Order ------------------ //
async function deleteInfo(orderId, index) {
    if (confirm("Are you sure you want to delete this order?")) {
        try {
            const response = await fetch(`/orders/${orderId}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
            const result = await response.json();

            if (response.ok) {
                getData.splice(index, 1);
                preLoadCalculations();

                if (getData.length === 0) {
                    currentIndex = 1; startIndex = 1; endIndex = 0;
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

// ------------------ Popup / Order Details ------------------ //
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

// ------------------ Payment Modal ------------------ //
const modal = document.getElementById("paymentModal");
const closeModal = document.getElementById("closeModal");
const amountInput = document.getElementById("amount");
const orderIdInput = document.getElementById("orderId");
const phoneInput = document.getElementById("phone");

function attachPurchaseEvents() {
    const purchaseButtons = document.querySelectorAll(".purchase-btn");
    purchaseButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const row = e.target.closest("tr");
            const orderId = row.dataset.id;
            const order = getData.find(o => o.id === orderId);

            if (order) {
                amountInput.value = order.totalPrice;
             
                orderIdInput.value = orderId;
                phoneInput.value = "";
                modal.style.display = "flex";
            }
        });
    });
}

closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

document.getElementById("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = amountInput.value;
    const phone = phoneInput.value;
    const reference = "REF" + Date.now();
    const orderId = orderIdInput.value;

    try {
        const response = await fetch("/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, phone, reference, orderId })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Payment successful!");
            modal.style.display = "none";
        } else {
            alert("Payment failed: " + result.error);
        }
    } catch (error) {
        console.error(error);
        alert("Error processing payment.");
    }
});
