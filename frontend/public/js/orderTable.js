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
    BuyerId = user ? (user._id || user.id) : null;

    if (!BuyerId) {
        console.error("No logged-in user found.");
        return;
    }

 try {
  console.log('Fetching orders for buyer:', BuyerId);
  const res = await fetch(`/orders/${BuyerId}?t=${Date.now()}`); // Add cache busting
  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  const responseData = await res.json();
  console.log('Raw server response:', responseData);
  
  // Handle new API response format
  const data = responseData.data || responseData;
  const orders = Array.isArray(data) ? data : (data.orders || []);

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
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
        getData = orders.map(order => ({
            id: order._id,
            picture: order.image || order.productImage || "/image/icons8-empty-box-100.png",
            productImage: order.image || order.productImage || "/image/icons8-empty-box-100.png",
            productName: order.productName || "Unknown Product",
            totalPrice: order.totalPrice,
            quantity: order.quantity || 1,
            sellerName: order.sellerName || "Unknown Seller",
            sellerId: order.sellerId,
            productId: order.productId,
            paidStatus: order.paidStatus || 'Pending',
            requestStatus: order.requestStatus || 'pending',
            unit: order.unit,
            deliveryStatus: order.deliveryStatus || 'Pending',
            canReview: order.canReview || false
        }));
        
        console.log('Mapped order data:', getData);
        console.log('Sample order status info:', getData.map(order => ({
            id: order.id,
            requestStatus: order.requestStatus,
            paidStatus: order.paidStatus,
            deliveryStatus: order.deliveryStatus,
            picture: order.picture
        })));
        console.log('Raw server data:', orders.map(order => ({
            id: order._id,
            requestStatus: order.requestStatus,
            paidStatus: order.paidStatus,
            deliveryStatus: order.deliveryStatus
        })));


        preLoadCalculations();
        displayIndexBtn();
        highlightIndexBtn();
        
        // Update dashboard stats
        updateDashboardStats();
    } catch (err) {
        console.error("Failed to load orders:", err);
    }
}

fetchOrders();

// ------------------ Handle Payment ------------------ //
function handlePayment(orderId) {
    console.log('Payment button clicked for order:', orderId);
    
    // Find the order to get the amount
    const order = getData.find(o => o.id === orderId);
    if (!order) {
        alert("Order not found!");
        return;
    }
    
    // Set the order ID and amount in the payment form
    document.getElementById('orderId').value = orderId;
    document.getElementById('amount').value = order.totalPrice;
    
    // Show the payment modal
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// ------------------ Handle Review Click ------------------ //
function handleReviewClick(orderId, sellerId, productId) {
    console.log('Review button clicked:', { orderId, sellerId, productId });
    
    // Check if review system is available
    if (window.reviewSystem) {
        window.reviewSystem.openReviewForm(orderId, sellerId, productId);
    } else {
        console.error('Review system not initialized');
        alert('Review system not available. Please refresh the page and try again.');
    }
}

// ------------------ Confirm Delivery ------------------ //
async function confirmDelivery(orderId) {
    if (confirm("Have you received this order? This will mark it as delivered and allow you to rate the seller.")) {
        try {
            console.log('Attempting to confirm delivery for orderId:', orderId);
            
            const response = await fetch(`/api/confirm-delivery/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin' // Include cookies for session
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (response.ok) {
                alert('Order confirmed as delivered! You can now rate the seller.');
                // Refresh the orders to update the display
                fetchOrders();
            } else {
                alert(data.error || 'Failed to confirm delivery');
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
            alert('Failed to confirm delivery. Please try again.');
        }
    }
}

// Add refresh functionality
function refreshOrders() {
    console.log("Refreshing orders...");
    fetchOrders();
}

// Make refreshOrders and fetchOrders globally accessible
window.refreshOrders = refreshOrders;
window.fetchOrders = fetchOrders;

// Buyer Dashboard Functions
function updateDashboardStats() {
    const totalOrders = getData.length;
    const completedOrders = getData.filter(order => order.requestStatus === 'completed').length;
    const pendingOrders = getData.filter(order => order.requestStatus === 'pending').length;
    const totalSpent = getData
        .filter(order => order.paidStatus === 'Paid')
        .reduce((sum, order) => sum + parseFloat(order.totalPrice || 0), 0);

    // Update dashboard stats
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalSpent').textContent = `K${totalSpent.toFixed(2)}`;
}

function exportOrders() {
    // Create CSV content
    const headers = ['Order ID', 'Product Name', 'Total Price', 'Quantity', 'Unit', 'Seller', 'Status', 'Paid Status'];
    const csvContent = [
        headers.join(','),
        ...getData.map(order => [
            order.id || '',
            `"${order.productName || ''}"`,
            order.totalPrice || '',
            order.quantity || '',
            order.unit || '',
            `"${order.sellerName || ''}"`,
            order.requestStatus || '',
            order.paidStatus || ''
        ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function filterOrders() {
    // Toggle advanced filter options
    const filters = document.querySelector('.order-filters');
    if (filters) {
        filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
    }
}

function filterByStatus() {
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const statusCell = row.querySelector('td:nth-child(7)'); // Status column
        if (statusCell) {
            const status = statusCell.textContent.toLowerCase().trim();
            if (statusFilter === 'all' || status.includes(statusFilter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

function sortOrders() {
    const sortFilter = document.getElementById('sortFilter').value;
    const tbody = document.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        switch (sortFilter) {
            case 'newest':
                return new Date(b.dataset.date || 0) - new Date(a.dataset.date || 0);
            case 'oldest':
                return new Date(a.dataset.date || 0) - new Date(b.dataset.date || 0);
            case 'price-high':
                return parseFloat(b.querySelector('td:nth-child(3)')?.textContent || 0) - 
                       parseFloat(a.querySelector('td:nth-child(3)')?.textContent || 0);
            case 'price-low':
                return parseFloat(a.querySelector('td:nth-child(3)')?.textContent || 0) - 
                       parseFloat(b.querySelector('td:nth-child(3)')?.textContent || 0);
            case 'name':
                return (a.querySelector('td:nth-child(2)')?.textContent || '').localeCompare(
                    b.querySelector('td:nth-child(2)')?.textContent || '');
            default:
                return 0;
        }
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

// Add refresh button event listener
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshOrders);
    }
    
    // Add event listener for payment buttons
    document.addEventListener('click', (e) => {
        if (e.target && e.target.closest && e.target.closest('.action-btn.payment')) {
            e.preventDefault();
            const orderRow = e.target.closest('tr');
            const orderId = orderRow.dataset.id;
            handlePayment(orderId);
        }
    });
});

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
                // Debug logging for status issues
                console.log(`Order ${order.id} status:`, {
                    requestStatus: order.requestStatus,
                    paidStatus: order.paidStatus,
                    deliveryStatus: order.deliveryStatus
                });
                
                // Determine status display and action button
                let statusDisplay = '';
                let statusClass = '';
                let actionButton = '';
                
                if (order.requestStatus === 'rejected') {
                    statusDisplay = '<span class="status-badge status-rejected">REJECTED</span>';
                    actionButton = `<button class="action-btn disabled" disabled title="Order Rejected">
                        <i class="fa fa-times"></i>
                    </button>`;
                } else if (order.requestStatus === 'pending') {
                    statusDisplay = '<span class="status-badge status-pending">PENDING APPROVAL</span>';
                    actionButton = `<button class="action-btn disabled" disabled title="Waiting for Seller Approval">
                        <i class="fa fa-clock"></i>
                    </button>`;
                } else if (order.requestStatus === 'accepted') {
                    if (order.paidStatus === 'Paid') {
                        if (order.deliveryStatus === 'Delivered') {
                            statusDisplay = '<span class="status-badge status-delivered">DELIVERED</span>';
                            actionButton = order.canReview ? 
                                `<button onclick="handleReviewClick('${order.id}', '${order.sellerId}', '${order.productId}')" class="action-btn review" title="Rate Seller">
                                    <i class="fa fa-star"></i>
                                </button>` :
                                `<button class="action-btn disabled" disabled title="Review Not Available">
                                    <i class="fa fa-star"></i>
                                </button>`;
                        } else {
                            statusDisplay = '<span class="status-badge status-shipped">SHIPPED</span>';
                            actionButton = `<button onclick="confirmDelivery('${order.id}')" class="action-btn delivery" title="Confirm Delivery">
                                <i class="fa fa-truck"></i>
                            </button>`;
                        }
                    } else {
                        statusDisplay = '<span class="status-badge status-accepted">APPROVED</span>';
                        actionButton = `<button class="action-btn payment" title="Make Payment">
                            <i class="fa fa-credit-card"></i>
                        </button>`;
                    }
                }

                let row = `<tr class="orderDetails" data-id="${order.id}">
                    <td><img src="${order.picture}" alt="${order.productName}" width="40" height="40" onerror="this.src='/image/icons8-empty-box-100.png'"></td>
                    <td>${order.productName}</td>
                    <td>k ${order.totalPrice}</td>
                    <td>${order.quantity}</td>
                    <td>${order.unit || "Unknown Unit"}</td>
                    <td>${order.sellerName || "Unknown Seller"}</td>
                    <td>${statusDisplay}</td>
                    <td>
                        <button onclick="readInfo('${order.picture}','${order.productName}','${order.totalPrice}','${order.quantity}','${order.sellerName}','${order.paidStatus}')" class="info-btn" title="View Details">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        ${getSmartActionButton(order, i)}
                        ${actionButton}
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

// ------------------ Smart Action Button ------------------ //
function getSmartActionButton(order, index) {
    // Check if order is cancelled (regardless of requestStatus)
    const isCancelled = order.deliveryStatus === 'Cancelled' || order.paidStatus === 'Rejected';
    
    // Show cancel button for active orders (pending or accepted) that are NOT cancelled
    if ((order.requestStatus === 'pending' || order.requestStatus === 'accepted') && !isCancelled) {
        return `<button onclick="cancelInfo('${order.id}', ${index})" class="smart-btn cancel-mode" title="Cancel Order">
                    <i class="fa fa-times"></i>
                    <span class="btn-text"></span>
                </button>`;
    }
    // Show delete button for completed, cancelled, or rejected orders
    else if (order.requestStatus === 'rejected' || isCancelled || 
             (order.paidStatus === 'Paid' && order.deliveryStatus === 'Delivered')) {
        return `<button onclick="deleteInfo('${order.id}', ${index})" class="smart-btn delete-mode" title="Delete Order">
                    <i class="fa-regular fa-trash-can"></i>
                    <span class="btn-text"></span>
                </button>`;
    }
    // Default to delete for any other status
    else {
        return `<button onclick="deleteInfo('${order.id}', ${index})" class="smart-btn delete-mode" title="Delete Order">
                    <i class="fa-regular fa-trash-can"></i>
                    <span class="btn-text">Delete</span>
                </button>`;
    }
}

// ------------------ Cancel Order ------------------ //
async function cancelInfo(orderId, index) {
    console.log('cancelInfo function called - version:', new Date().getTime());
    if (confirm("Are you sure you want to cancel this order?")) {
        try {
            console.log('Attempting to cancel order:', orderId);
            console.log('Current user session:', JSON.parse(localStorage.getItem('user')));
            
            const response = await fetch(`/orders/${orderId}`, { 
                method: "DELETE", 
                headers: { 
                    "Content-Type": "application/json" 
                },
                credentials: 'include' // Include cookies for session
            });
            
            console.log('Cancel response status:', response.status);
            console.log('Cancel response headers:', response.headers);
            
            const result = await response.json();
            console.log('Cancel response data:', result);

            if (response.ok) {
                // Instead of updating local data, refetch from server to get accurate data
                console.log('Order cancelled successfully, refetching data...');
                await fetchOrders(); // This will get fresh data from server
                alert("Order cancelled successfully");
            } else {
                alert(`Error: ${result.message || 'Failed to cancel order'}`);
            }
        } catch (error) {
            console.error("Failed to cancel order:", error);
            alert("Failed to cancel order. Please try again.");
        }
    }
}

// ------------------ Delete Order ------------------ //
async function deleteInfo(orderId, index) {
    if (confirm("Are you sure you want to delete this order?")) {
        try {
            console.log('Attempting to delete order:', orderId);
            console.log('Current user session:', JSON.parse(localStorage.getItem('user')));
            
            const response = await fetch(`/orders/${orderId}/delete`, { 
                method: "DELETE", 
                headers: { 
                    "Content-Type": "application/json" 
                },
                credentials: 'include' // Include cookies for session
            });
            
            console.log('Delete response status:', response.status);
            console.log('Delete response headers:', response.headers);
            
            const result = await response.json();
            console.log('Delete response data:', result);

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
                showInfo();
                updateDashboardStats();
                alert("Order deleted successfully");
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
// Function to reset submit button to original state
function resetSubmitButton() {
    const submitBtn = document.querySelector('.submitBtn');
    if (submitBtn) {
        submitBtn.textContent = 'Submit';
        submitBtn.type = 'submit';
        submitBtn.onclick = null; // Remove custom onclick handler
    }
}

function readInfo(pic, pName, tPrice, quantity, sName, pStatus) {
    // Handle image loading with fallback
    imgInput.src = pic || "/image/icons8-empty-box-100.png";
    imgInput.onerror = function() {
        this.src = "/image/icons8-empty-box-100.png";
    };
    form.querySelector("#productName").value = pName;
    form.querySelector("#totalPrice").value = tPrice;
    form.querySelector("#quantity").value = quantity;
    form.querySelector("#seller").value = sName;
    form.querySelector("#paidStatus").value = pStatus;

    darkBg.classList.add('active');
    popupForm.classList.add('active');
    popupFooter.style.display = "flex";
    modalTitle.innerHTML = "Order Details";

    formInputFields.forEach(input => input.disabled = true);
    imgHolder.style.pointerEvents = "none";
    
    // Store current order data for receipt
    const currentOrder = getData.find(order => 
        order.productName === pName && 
        order.totalPrice == tPrice && 
        order.quantity == quantity
    );
    
    // Modify the submit button to show receipt instead of submitting form
    const submitBtn = document.querySelector('.submitBtn');
    if (submitBtn && currentOrder) {
        // Change button text and functionality
        submitBtn.textContent = 'View Receipt';
        submitBtn.type = 'button'; // Change from submit to button
        submitBtn.onclick = (e) => {
            e.preventDefault();
            console.log('Submit/Receipt button clicked');
            if (window.receiptSystem) {
                window.receiptSystem.showOrderReceipt(currentOrder);
            } else {
                console.error('Receipt system not available');
                alert('Receipt system not available. Please refresh the page.');
            }
        };
    }
    
    // Show/hide print receipt button based on payment status
    const printReceiptBtn = document.getElementById('printReceiptFromDetailsBtn');
    if (printReceiptBtn) {
        console.log('Print receipt button found, checking status:', pStatus);
        
        if (pStatus === 'Paid') {
            printReceiptBtn.style.display = 'flex';
            console.log('Showing print receipt button for paid order');
            
            if (currentOrder) {
                printReceiptBtn.onclick = () => {
                    console.log('Print receipt button clicked');
                    if (window.receiptSystem) {
                        window.receiptSystem.showOrderReceipt(currentOrder);
                    }
                };
            }
        } else {
            printReceiptBtn.style.display = 'none';
            console.log('Hiding print receipt button for non-paid order');
        }
    } else {
        console.error('Print receipt button not found!');
    }
}

closeBtn.addEventListener('click', () => {
    darkBg.classList.remove('active');
    popupForm.classList.remove('active');
    form.reset();
    resetSubmitButton(); // Reset submit button to original state
});

// Close popup when clicking on dark background
darkBg.addEventListener('click', (e) => {
    if (e.target === darkBg) {
        darkBg.classList.remove('active');
        popupForm.classList.remove('active');
        form.reset();
        resetSubmitButton(); // Reset submit button to original state
    }
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
            // Check if button is disabled
            if (button.disabled) {
                const title = button.getAttribute('title');
                alert(title);
                return;
            }

            const row = e.target && e.target.closest ? e.target.closest("tr") : null;
            if (!row) return;
            
            const orderId = row.dataset.id;
            const order = getData.find(o => o.id === orderId);

            if (order) {
                // Double-check that order is accepted before allowing payment
                if (order.requestStatus !== 'accepted') {
                    alert("This order has not been accepted by the seller yet. Please wait for seller approval.");
                    return;
                }
                
                if (order.paidStatus === 'Paid') {
                    alert("This order has already been paid for.");
                    return;
                }

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

// Close modal when clicking outside
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

document.getElementById("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = amountInput.value;
    const phone = phoneInput.value;
    const orderId = orderIdInput.value;
    
    // Find the order to get the correct orderId (orderId field from database)
    const order = getData.find(o => o.id === orderId);
    if (!order) {
        alert("Order not found!");
        return;
    }
    
    // Use the order's ID as reference for the payment

    try {
        const response = await fetch("/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, phone, orderId })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Payment initiated! You will be notified when payment is confirmed.");
            modal.style.display = "none";
            
            // Start polling for payment status updates
            startPaymentStatusPolling(orderId);
        } else {
            alert("Payment failed: " + result.error);
        }
    } catch (error) {
        console.error(error);
        alert("Error processing payment.");
    }
});

// Function to poll for payment status updates
function startPaymentStatusPolling(orderId) {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/check-payment/${orderId}`);
            if (response.ok) {
                const orderData = await response.json();
                
                // Update the order in the local data
                const orderIndex = getData.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    getData[orderIndex].paidStatus = orderData.paidStatus;
                    
                    // Refresh the display
                    highlightIndexBtn();
                    
                    // Stop polling if payment is completed or failed
                    if (orderData.paidStatus === "Paid" || orderData.paidStatus === "Failed") {
                        clearInterval(pollInterval);
                        
                        if (orderData.paidStatus === "Paid") {
                            alert("Payment confirmed! Order status updated.");
                            
                            // Show receipt for successful payment
                            if (window.receiptSystem) {
                                const order = getData.find(o => o.id === orderId);
                                if (order) {
                                    // Update order data with payment confirmation
                                    order.paidStatus = "Paid";
                                    window.receiptSystem.showPaymentReceipt(order);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error checking payment status:", error);
        }
    }, 5000); // Check every 5 seconds
    
    // Stop polling after 5 minutes
    setTimeout(() => {
        clearInterval(pollInterval);
    }, 300000);
}
