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

async function runTests() {
  log('\n🧪 Testing ZamHarvest Layered Architecture', 'blue');
  log('=' .repeat(50), 'blue');

  // Test basic endpoints
  log('\n📄 Testing Basic Pages:', 'yellow');
  await testEndpoint('GET', '/home', null, 'Home Page');
  await testEndpoint('GET', '/login', null, 'Login Page');
  
  // Test API endpoints
  log('\n🔌 Testing API Endpoints:', 'yellow');
  await testEndpoint('GET', '/products-test', null, 'Products Test API');
  
  // Test authentication endpoints (these might fail without proper session)
  log('\n🔐 Testing Authentication APIs:', 'yellow');
  await testEndpoint('GET', '/api/auth/check', null, 'Auth Check API');
  
  // Test product endpoints
  log('\n📦 Testing Product APIs:', 'yellow');
  await testEndpoint('GET', '/api/products/categories', null, 'Product Categories API');
  await testEndpoint('GET', '/api/products/provinces', null, 'Product Provinces API');
  
  // Test messaging endpoints (might fail without session)
  log('\n💬 Testing Messaging APIs:', 'yellow');
  await testEndpoint('GET', '/api/messages/unread-count', null, 'Unread Messages Count API');

  log('\n🎯 Test Summary:', 'blue');
  log('If you see mostly ✅ green checkmarks, your layered architecture is working!', 'green');
  log('❌ Red X marks are expected for endpoints requiring authentication.', 'yellow');
  log('The important thing is that the server responds (not 404 errors).', 'yellow');
  
  log('\n📋 Next Steps:', 'blue');
  log('1. Start your frontend and test the full application', 'reset');
  log('2. Try logging in and using all features', 'reset');
  log('3. Compare behavior with your original version', 'reset');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
});

// Run tests
if (require.main === module) {
  log('🚀 Starting endpoint tests...', 'blue');
  log('Make sure your server is running on http://localhost:3000', 'yellow');
  
  setTimeout(() => {
    runTests().catch(error => {
      log(`❌ Test suite failed: ${error.message}`, 'red');
      process.exit(1);
    });
  }, 2000); // Wait 2 seconds for server to start
}

module.exports = { testEndpoint, runTests };
