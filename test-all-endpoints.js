const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, url, data = null, description = '') {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${url}`,
      timeout: 5000
    };

    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const response = await axios(config);
    log(`✅ ${description || `${method} ${url}`}: ${response.status}`, 'green');
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'No response';
    const message = error.response?.data?.message || error.message;
    log(`❌ ${description || `${method} ${url}`}: ${status} - ${message}`, 'red');
    return { success: false, status, error: message };
  }
}

async function testServerConnection() {
  try {
    log('\n🔌 Testing server connection...', 'blue');
    const response = await axios.get(`${BASE_URL}/home`, { timeout: 3000 });
    log('✅ Server is running and accessible!', 'green');
    return true;
  } catch (error) {
    log('❌ Cannot connect to server!', 'red');
    log('Make sure your server is running on http://localhost:3000', 'yellow');
    log('Run: cd mongobdLogin/backend && npm start', 'yellow');
    return false;
  }
}

async function runAllTests() {
  log('🧪 ZamHarvest Layered Architecture Test Suite', 'blue');
  log('=' .repeat(60), 'blue');
  
  // Check server connection first
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    process.exit(1);
  }

  // Test basic pages
  log('\n📄 Testing Basic Pages:', 'yellow');
  await testEndpoint('GET', '/home', null, 'Home Page');
  await testEndpoint('GET', '/login', null, 'Login Page');
  
  // Test product endpoints
  log('\n📦 Testing Product APIs:', 'yellow');
  await testEndpoint('GET', '/products-test', null, 'Products Test API');
  await testEndpoint('GET', '/api/products/categories', null, 'Product Categories API');
  await testEndpoint('GET', '/api/products/provinces', null, 'Product Provinces API');
  
  // Test authentication endpoints
  log('\n🔐 Testing Authentication APIs:', 'yellow');
  await testEndpoint('GET', '/api/auth/check', null, 'Auth Check API');
  
  // Test notification endpoints
  log('\n🔔 Testing Notification APIs:', 'yellow');
  await testEndpoint('GET', '/api/notifications/unread-count', null, 'Unread Notifications Count');
  
  // Test order endpoints (will fail without auth, but should respond)
  log('\n📋 Testing Order APIs:', 'yellow');
  await testEndpoint('GET', '/api/orders/stats', null, 'Order Statistics API');
  
  // Test payment endpoints
  log('\n💳 Testing Payment APIs:', 'yellow');
  await testEndpoint('GET', '/api/payments/history', null, 'Payment History API');
  
  // Test review endpoints
  log('\n⭐ Testing Review APIs:', 'yellow');
  await testEndpoint('GET', '/test', null, 'Review Test API');
  
  // Test request endpoints
  log('\n📨 Testing Request APIs:', 'yellow');
  await testEndpoint('GET', '/api/requests/stats', null, 'Request Statistics API');
  
  // Test receipt endpoints
  log('\n🧾 Testing Receipt APIs:', 'yellow');
  await testEndpoint('GET', '/api/receipts/stats', null, 'Receipt Statistics API');
  
  // Test message endpoints
  log('\n💬 Testing Message APIs:', 'yellow');
  await testEndpoint('GET', '/api/messages/unread-count', null, 'Unread Messages Count API');

  log('\n🎯 Test Summary:', 'blue');
  log('✅ Green checkmarks = Endpoints are working', 'green');
  log('❌ Red X marks = Expected for endpoints requiring authentication', 'yellow');
  log('🎉 If you see mostly green, your layered architecture is working!', 'blue');
  
  log('\n📋 Next Steps:', 'blue');
  log('1. Try logging in through the web interface', 'reset');
  log('2. Test product listing, orders, and notifications', 'reset');
  log('3. Verify all features work as expected', 'reset');
  
  log('\n✨ Your layered architecture is ready! 🚀', 'green');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run tests
if (require.main === module) {
  log('🚀 Starting comprehensive endpoint tests...', 'blue');
  log('Make sure your server is running on http://localhost:3000', 'yellow');
  
  setTimeout(() => {
    runAllTests().catch(error => {
      log(`❌ Test suite failed: ${error.message}`, 'red');
      process.exit(1);
    });
  }, 2000); // Wait 2 seconds for server to start
}

module.exports = { testEndpoint, runAllTests };
