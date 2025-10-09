const entries = document.querySelector(".showEntries");
const orderInfo = document.querySelector(".orderInfo");

let getData = [];
let arrayLength = 0, tableSize = 4, startIndex = 1, endIndex = 0, currentIndex = 1, maxIndex = 0;

// ------------------ Fetch Requests ------------------ //
async function fetchRequests() {
    try {
        const res = await fetch('/requests/my-requests', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log("Response status:", res.status);
        
        if (!res.ok) {
            if (res.status === 403) {
                console.error("Access denied. Please log in as a seller.");
                orderInfo.innerHTML = `
                    <tr class="orderDetails">
                        <td colspan="9" align="center" style="color: #e74c3c;">
                            Please log in as a seller to view requests
                        </td>
                    </tr>
                `;
                return;
            }
            throw new Error(`Server error: ${res.status}`);
        }

        const responseData = await res.json();
        
        // Handle new API response format
        const data = responseData.data || responseData;
        const requests = Array.isArray(data) ? data : (data.requests || []);
        
        console.log("Fetched requests:", requests);

        if (!requests || !Array.isArray(requests) || requests.length === 0) {
            orderInfo.innerHTML = `
                <tr class="orderDetails">
                    <td colspan="9" align="center" style="color: #555;">
                        <img src="/image/icons8-empty-box-100.png" 
                             alt="No requests" 
                             style="width:60px; height:60px; opacity:0.7; margin-bottom:10px; display:block; margin-left:auto; margin-right:auto;">
                        <p>No requests found.</p>
                    </td>
                </tr>
            `;
            return;
        }

        getData = requests.map(request => ({
            id: request._id,
            productName: request.product?.name || "Unknown Product",
            productImage: request.product?.image || "/image/icons8-empty-box-100.png",
            buyerName: request.buyer?.username || "Unknown Buyer",
            buyerEmail: request.buyer?.email || "",
            quantity: request.order?.quantity || 1,
            unit: request.order?.unit || "kg",
            totalPrice: request.order?.totalPrice || 0,
            deliveryDate: request.order?.deliveryDate ? new Date(request.order.deliveryDate).toLocaleDateString() : "Not specified",
            status: request.status || "pending",
            createdAt: new Date(request.createdAt).toLocaleDateString()
        }));

        preLoadCalculations();
        displayIndexBtn();
        highlightIndexBtn();
        updateDashboardStats();
    } catch (err) {
        console.error("Failed to load requests:", err);
        orderInfo.innerHTML = `
            <tr class="orderDetails">
                <td colspan="9" align="center" style="color: #060606ff;">
                    Error loading requests. Please try again.
                </td>
            </tr>
        `;
    }
}

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
    entries.textContent = `Showing ${startIndex}-${endIndex} of ${arrayLength} requests`;

    document.querySelectorAll('.pagination button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('index') === currentIndex.toString()) btn.classList.add('active');
    });

    showInfo();
}

function next() { 
    if (currentIndex < maxIndex) { 
        currentIndex++; 
        highlightIndexBtn(); 
    } 
}

function prev() { 
    if (currentIndex > 1) { 
        currentIndex--; 
        highlightIndexBtn(); 
    } 
}

function paginationBtn(i) { 
    currentIndex = i; 
    highlightIndexBtn(); 
}

// ------------------ Display Requests ------------------ //
function showInfo() {
    document.querySelectorAll(".orderDetails").forEach(info => info.remove());
    let tab_start = startIndex - 1, tab_end = endIndex;

    if (getData.length > 0) {
        for (let i = tab_start; i < tab_end; i++) {
            const request = getData[i];
            if (request) {
                const statusClass = request.status === 'accepted' ? 'status-accepted' : 
                                  request.status === 'rejected' ? 'status-rejected' : 'status-pending';
                
                let row = `<tr class="orderDetails" data-id="${request.id}">
                    <td>
                        <img src="${request.productImage}" alt="${request.productName}" width="40" height="40" style="border-radius: 4px;">
                    </td>
                    <td>${request.productName}</td>
                    <td>${request.buyerName}</td>
                    <td>${request.quantity}</td>
                    <td>${request.unit}</td>
                    <td>K ${request.totalPrice}</td>
                    <td>${request.deliveryDate}</td>
                    <td><span class="status ${statusClass}">${request.status}</span></td>
                    <td>
                        <button onclick="viewRequestDetails('${request.id}')" title="View Details">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        <button onclick="updateRequestStatus('${request.id}', 'accepted')" title="Accept">
                            <i class="fa fa-check"></i>
                        </button>
                        <button onclick="updateRequestStatus('${request.id}', 'rejected')" title="Reject">
                            <i class="fa fa-times"></i>
                        </button>
                    </td>
                </tr>
                `;
                orderInfo.innerHTML += row;
            }
        }
    } else {
        orderInfo.innerHTML = `<tr class="orderDetails"><td colspan="9" align="center">No data available in table</td></tr>`;
    }
}

// ------------------ Debug Session ------------------ //
async function debugSession() {
    try {
        const response = await fetch('/auth/session', {
            method: 'GET',
            credentials: 'include'
        });
        const sessionData = await response.json();
        console.log('Current session:', sessionData);
        return sessionData;
    } catch (error) {
        console.error('Failed to get session:', error);
        return null;
    }
}

// ------------------ Test Endpoint ------------------ //
async function testRequestEndpoint(requestId) {
    try {
        console.log('Testing request endpoint for ID:', requestId);
        const response = await fetch(`/requests/${requestId}`, {
            method: 'GET',
            credentials: 'include'
        });
        console.log('Request endpoint test response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        if (!response.ok) {
            const error = await response.json();
            console.log('Request endpoint error:', error);
        }
        return response;
    } catch (error) {
        console.error('Request endpoint test failed:', error);
        return null;
    }
}

// ------------------ Update Request Status ------------------ //
async function updateRequestStatus(requestId, newStatus) {
    if (confirm(`Are you sure you want to ${newStatus} this request?`)) {
        try {
            console.log('Updating request status:', { requestId, newStatus });
            
            // Debug session before making request
            await debugSession();
            
            // Test if the request exists
            await testRequestEndpoint(requestId);
            
            const response = await fetch(`/requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies for session
                body: JSON.stringify({ status: newStatus })
            });
            
            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url
            });

            if (response.ok) {
                // Update local data
                const requestIndex = getData.findIndex(r => r.id === requestId);
                if (requestIndex !== -1) {
                    getData[requestIndex].status = newStatus;
                    highlightIndexBtn(); // Refresh display
                }
                alert(`Request ${newStatus} successfully!`);
            } else {
                const error = await response.json();
                console.error('Error response:', error);
                console.error('Error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorObject: error
                });
                alert(`Failed to update request: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating request status:", error);
            console.error("Error details:", {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            alert(`Something went wrong: ${error.message || 'Please try again.'}`);
        }
    }
}

// ------------------ View Request Details ------------------ //
function viewRequestDetails(requestId) {
    const request = getData.find(r => r.id === requestId);
    if (request) {
        alert(`Request Details:\n\nProduct: ${request.productName}\nBuyer: ${request.buyerName}\nQuantity: ${request.quantity} ${request.unit}\nTotal Price: K ${request.totalPrice}\nDelivery Date: ${request.deliveryDate}\nStatus: ${request.status.toUpperCase()}`);
    }
}


// ------------------ Refresh Functionality ------------------ //
function refreshRequests() {
    console.log("Refreshing requests...");
    fetchRequests();
}

// Dashboard functionality
let currentFilter = 'all';

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'notifications') {
        loadNotifications();
    } else if (tabName === 'analytics') {
        loadAnalytics();
    }
}

// Filter requests by status
function filterRequests() {
    const filter = document.getElementById('statusFilter').value;
    currentFilter = filter;
    
    if (filter === 'all') {
        showInfo(); // Show all requests
    } else {
        const filteredData = getData.filter(request => request.status === filter);
        displayFilteredRequests(filteredData);
    }
}

// Display filtered requests
function displayFilteredRequests(filteredData) {
    document.querySelectorAll(".orderDetails").forEach(info => info.remove());
    let tab_start = startIndex - 1, tab_end = endIndex;

    if (filteredData.length > 0) {
        for (let i = tab_start; i < tab_end; i++) {
            const request = filteredData[i];
            if (request) {
                const statusClass = request.status === 'accepted' ? 'status-accepted' : 
                                  request.status === 'rejected' ? 'status-rejected' : 'status-pending';
                
                let row = `<tr class="orderDetails" data-id="${request.id}">
                    <td>
                        <img src="${request.productImage}" alt="${request.productName}" width="40" height="40" style="border-radius: 4px;">
                    </td>
                    <td>${request.productName}</td>
                    <td>${request.buyerName}</td>
                    <td>${request.quantity}</td>
                    <td>${request.unit}</td>
                    <td>K ${request.totalPrice}</td>
                    <td>${request.deliveryDate}</td>
                    <td><span class="status ${statusClass}">${request.status}</span></td>
                    <td>
                        <button onclick="viewRequestDetails('${request.id}')" title="View Details">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        <button onclick="updateRequestStatus('${request.id}', 'accepted')" title="Accept">
                            <i class="fa fa-check"></i>
                        </button>
                        <button onclick="updateRequestStatus('${request.id}', 'rejected')" title="Reject">
                            <i class="fa fa-times"></i>
                        </button>
                    </td>
                </tr>
                `;
                orderInfo.innerHTML += row;
            }
        }
    } else {
        orderInfo.innerHTML = `<tr class="orderDetails"><td colspan="9" align="center">No ${currentFilter} requests found</td></tr>`;
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalRequests = getData.length;
    const acceptedRequests = getData.filter(r => r.status === 'accepted').length;
    const pendingRequests = getData.filter(r => r.status === 'pending').length;
    const totalEarnings = getData
        .filter(r => r.status === 'accepted')
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    document.getElementById('totalRequests').textContent = totalRequests;
    document.getElementById('acceptedRequests').textContent = acceptedRequests;
    document.getElementById('pendingRequests').textContent = pendingRequests;
    document.getElementById('totalEarnings').textContent = 'K' + totalEarnings;
}

// Load notifications
function loadNotifications() {
    // This would typically fetch from an API
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = `
        <div class="notification-item">
            <i class="fa fa-info-circle"></i>
            <div class="notification-content">
                <p>Welcome to your seller dashboard!</p>
                <span class="notification-time">Just now</span>
            </div>
        </div>
        <div class="notification-item">
            <i class="fa fa-shopping-cart"></i>
            <div class="notification-content">
                <p>New request received for your product</p>
                <span class="notification-time">5 minutes ago</span>
            </div>
        </div>
        <div class="notification-item">
            <i class="fa fa-check-circle"></i>
            <div class="notification-content">
                <p>Request accepted successfully</p>
                <span class="notification-time">1 hour ago</span>
            </div>
        </div>
    `;
}

// Load analytics
function loadAnalytics() {
    // Placeholder for analytics data
    console.log('Loading analytics...');
}

// Export data functionality
function exportData() {
    const data = getData.map(request => ({
        Product: request.productName,
        Buyer: request.buyerName,
        Quantity: request.quantity,
        Unit: request.unit,
        Price: request.totalPrice,
        Status: request.status,
        Date: request.createdAt
    }));
    
    const csv = convertToCSV(data);
    downloadCSV(csv, 'requests-export.csv');
}

// Convert data to CSV
function convertToCSV(data) {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    return csvContent;
}

// Download CSV file
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchRequests();
});

// Auto-refresh every 60 seconds (increased from 30 seconds)
setInterval(() => {
    if (document.visibilityState === 'visible') {
        fetchRequests();
    }
}, 60000);
