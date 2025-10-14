# How to Use Payment Callback Test

## Overview
The `test-payment-callback.js` file is designed to test your payment callback functionality. This is crucial for ensuring your payment integration works correctly with payment gateways like ZynlePay.

## 🚀 Quick Start Guide

### Step 1: Start Your Server
```bash
# Make sure you're in the project root directory
cd mongobdLogin/backend
npm start
```

**Expected Output:**
```
Server running on http://0.0.0.0:3000
MongoDB connected
```

### Step 2: Choose Your Testing Method

## Method 1: Browser Console Testing (Recommended)

### 1. Open Your Browser
- Go to `http://localhost:3000`
- Open Developer Tools (F12)
- Go to the Console tab

### 2. Copy and Paste the Test Functions
```javascript
// Copy this entire function into browser console
async function testPaymentCallback() {
  const testData = {
    reference_no: "ORD-123456", // Replace with actual order ID
    status: "success",
    amount: 100,
    transaction_id: "TXN-789",
    message: "Payment successful"
  };

  try {
    console.log("Testing payment callback...");
    
    const response = await fetch('/payment-callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log("Callback response:", result);
    
    if (response.ok) {
      console.log("✅ Callback test successful!");
      
      // Check if order status was updated
      const checkResponse = await fetch(`/check-payment/${testData.reference_no}`);
      if (checkResponse.ok) {
        const orderData = await checkResponse.json();
        console.log("Order status:", orderData);
      }
    } else {
      console.log("❌ Callback test failed:", result);
    }
  } catch (error) {
    console.error("Error testing callback:", error);
  }
}
```

### 3. Run the Test
```javascript
// In browser console, run:
testPaymentCallback();
```

## Method 2: Node.js Testing

### 1. Create a Node.js Test File
```bash
# Create a new test file
touch test-payment-node.js
```

### 2. Install Required Dependencies
```bash
npm install axios
```

### 3. Create Node.js Test Script
```javascript
// test-payment-node.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPaymentCallback() {
  const testData = {
    reference_no: "ORD-" + Date.now(),
    status: "success",
    amount: 100,
    transaction_id: "TXN-" + Date.now(),
    message: "Payment successful"
  };

  try {
    console.log("Testing payment callback...");
    console.log("Test data:", testData);
    
    const response = await axios.post(`${BASE_URL}/payment-callback`, testData);
    
    console.log("✅ Callback test successful!");
    console.log("Response:", response.data);
    
    // Check order status
    try {
      const checkResponse = await axios.get(`${BASE_URL}/check-payment/${testData.reference_no}`);
      console.log("Order status:", checkResponse.data);
    } catch (checkError) {
      console.log("Could not check order status:", checkError.message);
    }
    
  } catch (error) {
    console.error("❌ Callback test failed:", error.response?.data || error.message);
  }
}

// Run the test
testPaymentCallback();
```

### 4. Run the Node.js Test
```bash
node test-payment-node.js
```

## Method 3: Postman Testing

### 1. Open Postman
- Create a new POST request
- URL: `http://localhost:3000/payment-callback`

### 2. Set Headers
```
Content-Type: application/json
```

### 3. Set Body (JSON)
```json
{
  "reference_no": "ORD-123456",
  "status": "success",
  "amount": 100,
  "transaction_id": "TXN-789",
  "message": "Payment successful"
}
```

### 4. Send Request
- Click Send
- Check the response

## 🧪 Test Scenarios

### Test Case 1: Successful Payment
```javascript
const successData = {
  reference_no: "ORD-SUCCESS-" + Date.now(),
  status: "success",
  amount: 100,
  transaction_id: "TXN-SUCCESS-" + Date.now(),
  message: "Payment successful"
};
```

### Test Case 2: Failed Payment
```javascript
const failedData = {
  reference_no: "ORD-FAILED-" + Date.now(),
  status: "failed",
  amount: 50,
  transaction_id: "TXN-FAILED-" + Date.now(),
  message: "Payment failed"
};
```

### Test Case 3: Cancelled Payment
```javascript
const cancelledData = {
  reference_no: "ORD-CANCELLED-" + Date.now(),
  status: "cancelled",
  amount: 25,
  transaction_id: "TXN-CANCELLED-" + Date.now(),
  message: "Payment cancelled"
};
```

## 📊 Expected Results

### Successful Test Response
```json
{
  "success": true,
  "message": "Payment callback processed successfully",
  "orderId": "ORD-123456",
  "status": "success"
}
```

### Failed Test Response
```json
{
  "success": false,
  "message": "Payment failed",
  "orderId": "ORD-123456",
  "status": "failed"
}
```

## 🔍 What to Check

### 1. Server Logs
Watch your server console for:
```
[PaymentService] Processing callback for order: ORD-123456
[PaymentService] Payment status updated: success
[NotificationService] Payment notification sent
```

### 2. Database Changes
Check if:
- Order status updated in database
- Payment records created
- Notifications generated

### 3. Response Validation
Verify:
- HTTP status codes (200 for success, 400/500 for errors)
- Response JSON structure
- Error messages are meaningful

## 🚨 Troubleshooting

### Issue 1: 404 Not Found
**Problem:** `/payment-callback` endpoint doesn't exist
**Solution:** Check if payment routes are properly configured in your layered architecture

### Issue 2: 500 Internal Server Error
**Problem:** Server error processing callback
**Solution:** Check server logs for detailed error messages

### Issue 3: Order Not Found
**Problem:** `reference_no` doesn't match any order
**Solution:** Use a valid order ID from your database

### Issue 4: Database Connection Error
**Problem:** MongoDB not connected
**Solution:** Ensure MongoDB is running and connection string is correct

## 🔧 Advanced Testing

### Test All Payment Statuses
```javascript
async function testAllPaymentStatuses() {
  const testCases = [
    { status: "success", amount: 100 },
    { status: "failed", amount: 50 },
    { status: "cancelled", amount: 25 },
    { status: "pending", amount: 75 }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing ${testCase.status} status ---`);
    
    const testData = {
      reference_no: "ORD-TEST-" + Date.now(),
      status: testCase.status,
      amount: testCase.amount,
      transaction_id: "TXN-" + Date.now()
    };

    try {
      const response = await fetch('/payment-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      console.log(`${testCase.status} result:`, result);
    } catch (error) {
      console.error(`Error testing ${testCase.status}:`, error);
    }
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run comprehensive test
testAllPaymentStatuses();
```

## 📝 Integration with Your Layered Architecture

Since you now have a layered architecture, your payment callback should flow through:

1. **Route** (`/payment-callback`) → 
2. **Controller** (PaymentController) → 
3. **Service** (PaymentService) → 
4. **Repository** (OrderRepository) → 
5. **Database** (MongoDB)

### Verify Each Layer
- **Route**: Endpoint responds
- **Controller**: Proper HTTP handling
- **Service**: Business logic executes
- **Repository**: Database updates
- **Database**: Data persists

## 🎯 Success Criteria

Your payment callback test is successful if:

- ✅ Server responds with 200 status
- ✅ Order status updates in database
- ✅ Proper JSON response returned
- ✅ Notifications triggered (if applicable)
- ✅ Error handling works for invalid data
- ✅ All payment statuses handled correctly

## 📞 Quick Commands Summary

```bash
# Start server
cd backend && npm start

# Test in browser console
testPaymentCallback();

# Test all statuses
testAllPaymentStatuses();

# Check server logs
# Watch the terminal where you started the server
```

This testing approach will help you verify that your payment integration works correctly with your new layered architecture!
