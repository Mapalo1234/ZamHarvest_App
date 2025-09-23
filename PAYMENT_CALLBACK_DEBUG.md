# Payment Callback Debugging Guide

## Issues Fixed:

### 1. **Missing Callback URL in Payment Request**
- **Problem**: Your payment request wasn't including a callback URL
- **Fix**: Added `callback_url` to the payment payload
- **Code**: The callback URL is now automatically generated as `${req.protocol}://${req.get('host')}/payment-callback`

### 2. **Enhanced Callback Handling**
- **Problem**: Callback wasn't updating order status or creating notifications
- **Fix**: Added comprehensive callback processing that:
  - Updates order payment status
  - Creates notifications for both buyer and seller
  - Handles both success and failure cases

### 3. **Added Debugging Tools**
- **Test callback endpoint**: `GET /test-callback`
- **Payment status check**: `GET /check-payment/:reference`

## How to Test:

### 1. **Test Callback Endpoint**
```bash
# Test if your callback endpoint is accessible
curl http://localhost:3000/test-callback
```

### 2. **Check Payment Status**
```bash
# Check payment status for a specific order
curl http://localhost:3000/check-payment/ORD-123456
```

### 3. **Test Payment Flow**
1. **Create an order** (this will generate a reference number)
2. **Make a payment** using the reference number
3. **Check the callback** by visiting `/test-callback`
4. **Verify order status** using `/check-payment/:reference`

## Common Issues & Solutions:

### Issue 1: Callback URL Not Accessible
**Problem**: ZynlePay can't reach your callback URL
**Solutions**:
- Make sure your server is running on a public IP/domain
- Use ngrok for local testing: `ngrok http 3000`
- Update the callback URL in your payment request

### Issue 2: Callback Not Being Called
**Problem**: ZynlePay isn't calling your callback
**Solutions**:
- Check if you're using the correct API endpoint
- Verify your API credentials
- Check ZynlePay dashboard for webhook logs
- Ensure the callback URL is accessible from the internet

### Issue 3: Callback Data Format
**Problem**: Callback data format doesn't match expected format
**Solutions**:
- Check ZynlePay documentation for exact callback format
- Add more logging to see what data is being sent
- Update the callback handler to match the actual format

## Debugging Steps:

### 1. **Check Server Logs**
```bash
# Look for these log messages:
# - "ZynlePay Callback Received:"
# - "Payment update for [reference]: [status]"
# - "Order [reference] marked as paid"
```

### 2. **Test with ngrok (for local development)**
```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# In another terminal, expose your server
ngrok http 3000

# Use the ngrok URL as your callback URL
# Example: https://abc123.ngrok.io/payment-callback
```

### 3. **Manual Callback Test**
```bash
# Test the callback endpoint manually
curl -X POST http://localhost:3000/payment-callback \
  -H "Content-Type: application/json" \
  -d '{
    "reference_no": "ORD-123456",
    "status": "success",
    "amount": 100,
    "transaction_id": "TXN-789"
  }'
```

## Updated Payment Flow:

1. **User initiates payment** → `/pay` endpoint
2. **Payment request sent to ZynlePay** with callback URL
3. **ZynlePay processes payment** and calls your callback
4. **Callback updates order status** and creates notifications
5. **Users receive notifications** about payment status

## Environment Variables (Optional):

Add these to your `.env` file for better configuration:

```env
# Payment Configuration
ZYNLEPAY_API_ID=47a68b45-3dec-4616-9586-fab119a16030
ZYNLEPAY_MERCHANT_ID=MEC01011
ZYNLEPAY_API_KEY=d62f223f-b867-4412-8413-c288d62da930
ZYNLEPAY_CALLBACK_URL=https://yourdomain.com/payment-callback
```

## Next Steps:

1. **Test the callback endpoint** using the test route
2. **Make a test payment** and check if callback is received
3. **Check server logs** for any errors
4. **Verify order status** is updated correctly
5. **Check notifications** are created for users

If you're still not receiving callbacks, the issue is likely with:
- ZynlePay configuration
- Network accessibility
- API credentials
- Callback URL format
