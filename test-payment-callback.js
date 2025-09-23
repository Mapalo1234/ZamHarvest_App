// Test script for payment callback
// Run this in your browser console or use Postman

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

// Test with different statuses
async function testAllPaymentStatuses() {
  const testCases = [
    { status: "success", amount: 100 },
    { status: "failed", amount: 50 },
    { status: "cancelled", amount: 25 }
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
  }
}

// Run the tests
console.log("Payment Callback Test Script");
console.log("1. Run testPaymentCallback() to test a single callback");
console.log("2. Run testAllPaymentStatuses() to test all statuses");
console.log("3. Check your server logs for detailed information");

// Uncomment to run automatically
// testPaymentCallback();
