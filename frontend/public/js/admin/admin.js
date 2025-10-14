// Admin Dashboard JavaScript
let revenueChart, userGrowthChart;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        initializeCharts();
    }, 100);
    // Don't immediately load dashboard data - it's already rendered server-side
    // loadDashboardData(); // Commented out - data is already rendered
});

// Show different sections
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    
    // Load section data
    loadSectionData(sectionName);
}

// Initialize charts with real data
async function initializeCharts() {
    try {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }

        // Load real chart data
        const chartsData = await loadChartData();
        if (!chartsData) {
            console.error('Failed to load chart data');
            return;
        }

        // Revenue Chart
        const revenueCanvas = document.getElementById('revenueChart');
        if (!revenueCanvas) {
            console.error('Revenue chart canvas not found');
            return;
        }
        const revenueCtx = revenueCanvas.getContext('2d');
        revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: chartsData.revenue.labels,
                datasets: [{
                    label: 'Revenue (ZMW)',
                    data: chartsData.revenue.data,
                    borderColor: '#4299e1',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });

        console.log('Revenue chart initialized with real data');

        // User Growth Chart
        const userGrowthCanvas = document.getElementById('userGrowthChart');
        if (!userGrowthCanvas) {
            console.error('User growth chart canvas not found');
            return;
        }
        const userGrowthCtx = userGrowthCanvas.getContext('2d');
        userGrowthChart = new Chart(userGrowthCtx, {
            type: 'bar',
            data: {
                labels: chartsData.userGrowth.labels,
                datasets: [{
                    label: 'New Users',
                    data: chartsData.userGrowth.data,
                    backgroundColor: '#48bb78',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
        console.log('User growth chart initialized with real data');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Load chart data from API
async function loadChartData() {
    try {
        const response = await fetch('/admin/dashboard/charts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('Chart data loaded:', responseData);
            if (responseData && responseData.data && responseData.data.charts) {
                return responseData.data.charts;
            }
        } else {
            console.error('Failed to load chart data, status:', response.status);
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
    return null;
}

// Toggle chart size
function toggleChartSize() {
    const chartsGrid = document.getElementById('chartsGrid');
    const toggleBtn = document.getElementById('chartToggle');
    
    if (chartsGrid.classList.contains('compact')) {
        chartsGrid.classList.remove('compact');
        toggleBtn.textContent = '📊 Compact View';
    } else {
        chartsGrid.classList.add('compact');
        toggleBtn.textContent = '📊 Full View';
    }
    
    // Resize charts
    if (revenueChart) revenueChart.resize();
    if (userGrowthChart) userGrowthChart.resize();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/admin/dashboard/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('Dashboard API response:', responseData);
            if (responseData && responseData.data && responseData.data.stats) {
                updateDashboardWithRealData(responseData.data.stats);
            } else {
                console.error('Invalid dashboard response format:', responseData);
            }
        } else {
            console.error('Failed to fetch dashboard data, status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update dashboard with real data
function updateDashboardWithRealData(stats) {
    console.log('Updating dashboard with data:', stats);
    
    // Safety check for stats object
    if (!stats) {
        console.error('Stats data is undefined');
        return;
    }

    // Update stats cards with safety checks
    updateStatsCard('totalUsers', stats.users?.total || 0);
    updateStatsCard('totalProducts', stats.products?.total || 0);
    updateStatsCard('totalOrders', stats.orders?.total || 0);
    updateStatsCard('totalRevenue', stats.revenue?.total || 0);

    // Update recent orders
    updateRecentOrders(stats.recentOrders || []);
}

// Update individual stat card
function updateStatsCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value.toLocaleString();
    }
}

// Update recent orders table
function updateRecentOrders(orders) {
    const tbody = document.querySelector('#recentOrdersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (orders && orders.length > 0) {
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.orderId}</td>
                <td>${order.buyerId?.username || 'N/A'}</td>
                <td>ZMW ${order.totalPrice}</td>
                <td><span class="badge badge-${getStatusClass(order.paidStatus)}">${order.paidStatus}</span></td>
                <td>${formatDate(order.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn" onclick="viewOrder('${order._id}')">View</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No recent orders</td></tr>';
    }
}

// Get status class for styling
function getStatusClass(status) {
    switch (status) {
        case 'Paid': return 'success';
        case 'Pending': return 'warning';
        case 'Failed': return 'danger';
        default: return 'secondary';
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Load section-specific data
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Load users data
async function loadUsers() {
    const content = document.getElementById('usersContent');
    content.innerHTML = '<div class="loading">Loading users...</div>';

    try {
        const response = await fetch('/admin/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log('Users API response status:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Users API response data:', responseData);
            if (responseData && responseData.data && responseData.data.users) {
                renderUsersTable(responseData.data.users);
            } else {
                content.innerHTML = '<div class="error">Invalid response format</div>';
            }
        } else {
            const errorText = await response.text();
            console.error('Users API error response:', errorText);
            content.innerHTML = '<div class="error">Failed to load users (Status: ' + response.status + ')</div>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        content.innerHTML = '<div class="error">Error loading users: ' + error.message + '</div>';
    }
}

// Render users table with real data
function renderUsersTable(usersData) {
    const content = document.getElementById('usersContent');
    const users = usersData.list || [];
    
    content.innerHTML = `
        <div class="table-card">
            <div class="table-header">
                <h3>All Users (${usersData.total || 0})</h3>
                <div class="user-stats">
                    <span class="stat">Buyers: ${usersData.buyers || 0}</span>
                    <span class="stat">Sellers: ${usersData.sellers || 0}</span>
                    <span class="stat">Active: ${usersData.active || 0}</span>
                </div>
            </div>
            <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                            <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.username || 'N/A'}</td>
                                <td>${user.email || 'N/A'}</td>
                                <td><span class="badge badge-${user.role === 'buyer' ? 'info' : 'warning'}">${user.role}</span></td>
                                <td><span class="badge badge-${user.isActive ? 'success' : 'danger'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td>${formatDate(user.createdAt)}</td>
                        <td>
                            <div class="action-buttons">
                                        <button class="icon-btn" onclick="toggleUserStatus('${user._id}', '${user.role}')">
                                            ${user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                            </div>
                        </td>
                    </tr>
                        `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
}

// Load products data
async function loadProducts() {
    const content = document.getElementById('productsContent');
    content.innerHTML = '<div class="loading">Loading products...</div>';

    try {
        const response = await fetch('/admin/products', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log('Products API response status:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Products API response data:', responseData);
            if (responseData && responseData.data && responseData.data.products) {
                renderProductsTable(responseData.data.products);
            } else {
                content.innerHTML = '<div class="error">Invalid response format</div>';
            }
        } else {
            const errorText = await response.text();
            console.error('Products API error response:', errorText);
            content.innerHTML = '<div class="error">Failed to load products (Status: ' + response.status + ')</div>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        content.innerHTML = '<div class="error">Error loading products: ' + error.message + '</div>';
    }
}

// Render products table with real data
function renderProductsTable(productsData) {
    const content = document.getElementById('productsContent');
    const products = productsData.list || [];
    
    content.innerHTML = `
        <div class="table-card">
            <div class="table-header">
                <h3>All Products (${productsData.total || 0})</h3>
                <div class="product-stats">
                    <span class="stat">Active: ${productsData.active || 0}</span>
                    <span class="stat">Pending: ${productsData.pending || 0}</span>
                    <span class="stat">Out of Stock: ${productsData.outOfStock || 0}</span>
                </div>
            </div>
            <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                            <th>Seller</th>
                        <th>Status</th>
                            <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>${product.name || 'N/A'}</td>
                                <td>${product.category || 'N/A'}</td>
                                <td>ZMW ${product.price || 0}</td>
                                <td>${product.sellerId?.username || 'N/A'}</td>
                                <td><span class="badge badge-${product.isActive ? 'success' : 'danger'}">${product.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td>${formatDate(product.createdAt)}</td>
                        <td>
                            <div class="action-buttons">
                                        <button class="icon-btn" onclick="toggleProductStatus('${product._id}')">
                                            ${product.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                            </div>
                        </td>
                    </tr>
                        `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
}

// Load orders data
async function loadOrders() {
    const content = document.getElementById('ordersContent');
    content.innerHTML = '<div class="loading">Loading orders...</div>';

    try {
        const response = await fetch('/admin/orders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log('Orders API response status:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Orders API response data:', responseData);
            if (responseData && responseData.data && responseData.data.orders) {
                renderOrdersTable(responseData.data.orders);
            } else {
                content.innerHTML = '<div class="error">Invalid response format</div>';
            }
        } else {
            const errorText = await response.text();
            console.error('Orders API error response:', errorText);
            content.innerHTML = '<div class="error">Failed to load orders (Status: ' + response.status + ')</div>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        content.innerHTML = '<div class="error">Error loading orders: ' + error.message + '</div>';
    }
}

// Render orders table with real data
function renderOrdersTable(ordersData) {
    const content = document.getElementById('ordersContent');
    const orders = ordersData.list || [];
    
    content.innerHTML = `
        <div class="table-card">
            <div class="table-header">
                <h3>All Orders (${ordersData.total || 0})</h3>
                <div class="order-stats">
                    <span class="stat">Completed: ${ordersData.completed || 0}</span>
                    <span class="stat">Pending: ${ordersData.pending || 0}</span>
                    <span class="stat">Revenue: ZMW ${ordersData.revenue || 0}</span>
                </div>
            </div>
            <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Buyer</th>
                            <th>Seller</th>
                        <th>Amount</th>
                        <th>Status</th>
                            <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>#${order.orderId || 'N/A'}</td>
                                <td>${order.buyerId?.username || 'N/A'}</td>
                                <td>${order.sellerId?.username || 'N/A'}</td>
                                <td>ZMW ${order.totalPrice || 0}</td>
                                <td><span class="badge badge-${getStatusClass(order.paidStatus)}">${order.paidStatus || 'Unknown'}</span></td>
                                <td>${formatDate(order.createdAt)}</td>
                        <td>
                            <div class="action-buttons">
                                        <button class="icon-btn" onclick="viewOrder('${order._id}')">View</button>
                                        <button class="icon-btn" onclick="updateOrderStatus('${order._id}')">Update</button>
                            </div>
                        </td>
                    </tr>
                        `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
}

// Load analytics data
function loadAnalytics() {
    const content = document.getElementById('analyticsContent');
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-info">
                    <p>Page Views</p>
                    <h3>12,456</h3>
                    <span class="stat-change">↑ 8.2%</span>
                </div>
                <div class="stat-icon icon-blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                </div>
            </div>
        </div>
    `;
}

// Load settings data
function loadSettings() {
    const content = document.getElementById('settingsContent');
    content.innerHTML = `
        <div class="table-card">
            <div class="table-header">
                <h3>System Settings</h3>
                <button class="btn-primary">Save Changes</button>
            </div>
            <div style="padding: 20px;">
                <p>Settings configuration will be implemented here.</p>
            </div>
        </div>
    `;
}

// Action functions
async function toggleUserStatus(userId, role) {
    try {
        console.log(`Toggling status for user: ${userId}, role: ${role}`);
        
        const response = await fetch(`/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ role })
        });

        console.log(`Response status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log('Status update response:', data);
            alert('User status updated successfully');
            loadUsers(); // Refresh users table
        } else {
            const errorData = await response.text();
            console.error('Error response:', errorData);
            alert(`Failed to update user status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        alert('Error updating user status: ' + error.message);
    }
}

async function toggleProductStatus(productId) {
    try {
        const response = await fetch(`/admin/products/${productId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (response.ok) {
            alert('Product status updated successfully');
            loadProducts(); // Refresh products table
        } else {
            alert('Failed to update product status');
        }
    } catch (error) {
        console.error('Error updating product status:', error);
        alert('Error updating product status');
    }
}

async function updateOrderStatus(orderId) {
    // Create a modal for status selection
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; min-width: 300px;">
            <h3 style="margin: 0 0 15px 0;">Update Order Status</h3>
            <select id="statusSelect" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
            </select>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelBtn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="updateBtn" style="padding: 8px 16px; background: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer;">Update</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const statusSelect = modal.querySelector('#statusSelect');
    const cancelBtn = modal.querySelector('#cancelBtn');
    const updateBtn = modal.querySelector('#updateBtn');
    
    // Handle cancel
    cancelBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Handle update
    updateBtn.onclick = async () => {
        const newStatus = statusSelect.value;
        if (!newStatus) {
            alert('Please select a status');
            return;
        }
        
        try {
            const response = await fetch(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert('Order status updated successfully');
                loadOrders(); // Refresh orders table
                document.body.removeChild(modal);
            } else {
                const errorData = await response.text();
                console.error('Error response:', errorData);
                alert(`Failed to update order status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Error updating order status: ' + error.message);
        }
    };
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// Utility functions
function refreshData() {
    console.log('Refreshing data...');
    // Show loading state
    const refreshBtn = document.querySelector('button[onclick="refreshData()"]');
    if (refreshBtn) {
        refreshBtn.textContent = 'Refreshing...';
        refreshBtn.disabled = true;
    }
    // Reload the entire page to get fresh server-side data
    window.location.reload();
}

function exportData() {
    console.log('Exporting data...');
    alert('Export functionality coming soon');
}

function viewOrder(orderId) {
    console.log('Viewing order:', orderId);
    alert('Order view functionality coming soon');
}

function editOrder(orderId) {
    console.log('Editing order:', orderId);
    alert('Order edit functionality coming soon');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/admin/login';
    }
}

