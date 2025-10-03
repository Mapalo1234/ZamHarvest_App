// Admin Dashboard JavaScript
let revenueChart, userGrowthChart;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadDashboardData();
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

// Initialize charts
function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue (ZMW)',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
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

    // User Growth Chart
    const userGrowthCtx = document.getElementById('userGrowthChart').getContext('2d');
    userGrowthChart = new Chart(userGrowthCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'New Users',
                data: [45, 78, 92, 65, 88, 120],
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
function loadDashboardData() {
    // This would typically fetch data from API
    console.log('Loading dashboard data...');
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
function loadUsers() {
    const content = document.getElementById('usersContent');
    content.innerHTML = `
        <div class="table-card">
            <div class="table-header">
                <h3>All Users</h3>
                <button class="btn-primary">Add User</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>John Doe</td>
                        <td>john@example.com</td>
                        <td>Buyer</td>
                        <td><span class="badge badge-success">Active</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="icon-btn">Edit</button>
                                <button class="icon-btn">Delete</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// Load products data
function loadProducts() {
    const content = document.getElementById('productsContent');
    content.innerHTML = `
        <div class="table-card">
            <div class="table-header">
                <h3>All Products</h3>
                <button class="btn-primary">Add Product</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Fresh Tomatoes</td>
                        <td>Vegetables</td>
                        <td>ZMW 15</td>
                        <td><span class="badge badge-success">Active</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="icon-btn">Edit</button>
                                <button class="icon-btn">Delete</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// Load orders data
function loadOrders() {
    const content = document.getElementById('ordersContent');
    content.innerHTML = `
        <div class="table-card">
            <div class="table-header">
                <h3>All Orders</h3>
                <button class="btn-primary">Create Order</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Buyer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#ORD-001</td>
                        <td>John Doe</td>
                        <td>ZMW 150</td>
                        <td><span class="badge badge-warning">Pending</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="icon-btn">View</button>
                                <button class="icon-btn">Edit</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
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

// Utility functions
function refreshData() {
    console.log('Refreshing data...');
    loadDashboardData();
}

function exportData() {
    console.log('Exporting data...');
}

function viewOrder(orderId) {
    console.log('Viewing order:', orderId);
}

function editOrder(orderId) {
    console.log('Editing order:', orderId);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/admin/login';
    }
}

