# 🧪 Practical Testing Guide for Error Handling & Logging

This guide provides step-by-step instructions to test all the error handling and logging improvements we've implemented.

## 🚀 Quick Start

### 1. Run the Simple Test Script

```bash
cd mongobdLogin/backend
node test-simple-error-handling.js
```

This will test the basic logging and error handling functionality.

## 📋 Comprehensive Testing Steps

### Step 1: Test Basic Logging System

1. **Run the simple test:**
   ```bash
   node test-simple-error-handling.js
   ```

2. **Check log files:**
   ```bash
   ls logs/
   # You should see: info-YYYY-MM-DD.log, error-YYYY-MM-DD.log, etc.
   ```

3. **View log contents:**
   ```bash
   # View info logs
   Get-Content logs/info-*.log | Select-Object -First 5
   
   # View error logs
   Get-Content logs/error-*.log | Select-Object -First 5
   ```

### Step 2: Test Application Startup

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Check console output** - You should see:
   - MongoDB connection logs
   - Server startup messages
   - Request logging for each HTTP request

3. **Check log files** - New entries should appear in:
   - `info-*.log` for general information
   - `error-*.log` for any errors

### Step 3: Test HTTP Request Logging

1. **Open your browser** and navigate to: `http://localhost:3000`

2. **Check the console** - You should see HTTP request logs like:
   ```
   🟢 GET / 302 - 15ms
   🟢 GET /home 200 - 8ms
   ```

3. **Check log files** - Look for HTTP request entries in `info-*.log`

### Step 4: Test Error Responses

#### 4.1 Test 404 Errors

1. **Navigate to a non-existent page:**
   ```
   http://localhost:3000/nonexistent-page
   ```

2. **Expected result:**
   - Browser shows "Page not found"
   - Console shows 404 warning log
   - Log file contains 404 entry

#### 4.2 Test Authentication Errors

1. **Try to access protected routes without login:**
   ```
   http://localhost:3000/add
   http://localhost:3000/view
   ```

2. **Expected result:**
   - Redirected to login page
   - Console shows authentication logs
   - Log files contain auth-related entries

#### 4.3 Test API Errors

1. **Test invalid product ID:**
   ```bash
   curl http://localhost:3000/api/products/invalid-id
   ```

2. **Expected result:**
   - JSON error response with proper status code
   - Console shows error logs
   - Log files contain error details

### Step 5: Test Form Validation Errors

#### 5.1 Test User Registration

1. **Go to signup page:** `http://localhost:3000/signup`

2. **Submit empty form** - You should see:
   - Validation error messages
   - Console logs for validation failures
   - Log files contain validation errors

3. **Submit invalid email** - You should see:
   - Email validation error
   - Proper error logging

#### 5.2 Test Product Creation

1. **Login as a seller** (if you have test data)

2. **Go to add product page:** `http://localhost:3000/add`

3. **Submit incomplete form** - You should see:
   - Validation error messages
   - Console logs for validation failures
   - Log files contain product creation errors

### Step 6: Test Database Error Handling

#### 6.1 Test Invalid Database Operations

1. **Try to access a product with invalid ID:**
   ```bash
   curl http://localhost:3000/api/products/507f1f77bcf86cd799439011
   ```

2. **Expected result:**
   - 404 error response
   - Console shows database error logs
   - Log files contain database operation details

#### 6.2 Test Database Connection

1. **Stop MongoDB** (if running locally)

2. **Restart the application:**
   ```bash
   npm run dev
   ```

3. **Expected result:**
   - Console shows MongoDB connection error
   - Error logs contain connection failure details
   - Application handles the error gracefully

### Step 7: Test Error Response Formats

#### 7.1 Test JSON API Responses

1. **Make API requests that should fail:**
   ```bash
   # Test without authentication
   curl http://localhost:3000/api/products
   
   # Test with invalid data
   curl -X POST http://localhost:3000/signup -H "Content-Type: application/json" -d "{}"
   ```

2. **Expected JSON response format:**
   ```json
   {
     "success": false,
     "message": "Error message",
     "status": "fail"
   }
   ```

#### 7.2 Test HTML Error Pages

1. **Navigate to non-existent pages:**
   ```
   http://localhost:3000/nonexistent
   ```

2. **Expected result:**
   - HTML error page
   - Proper error logging
   - User-friendly error message

### Step 8: Test Log File Management

#### 8.1 Check Log File Rotation

1. **Wait for the next day** or manually change system date

2. **Make some requests** to generate new logs

3. **Check logs directory:**
   ```bash
   ls logs/
   ```

4. **Expected result:**
   - New log files with today's date
   - Old log files preserved

#### 8.2 Test Log File Contents

1. **View different log types:**
   ```bash
   # View info logs
   Get-Content logs/info-*.log | Select-Object -Last 10
   
   # View error logs
   Get-Content logs/error-*.log | Select-Object -Last 10
   
   # View warning logs
   Get-Content logs/warn-*.log | Select-Object -Last 10
   ```

2. **Expected result:**
   - Structured JSON logs
   - Proper timestamps
   - Relevant metadata

### Step 9: Test Performance Logging

#### 9.1 Test Database Performance Logging

1. **Make requests that involve database operations:**
   - View products page
   - Search for products
   - Create/update products

2. **Check logs for performance entries:**
   ```bash
   Get-Content logs/info-*.log | Select-String "performance"
   ```

3. **Expected result:**
   - Performance logs with duration
   - Database operation details
   - Response time information

### Step 10: Test Error Recovery

#### 10.1 Test Application Recovery

1. **Cause a temporary error** (e.g., invalid database query)

2. **Fix the error** (e.g., correct the query)

3. **Verify the application recovers:**
   - Application continues running
   - New requests work normally
   - Error logs show the recovery

#### 10.2 Test Graceful Degradation

1. **Disable a non-critical service** (e.g., email service)

2. **Make requests that would use that service**

3. **Expected result:**
   - Application continues working
   - Error logs show the service failure
   - User gets appropriate error message

## 🔍 Monitoring and Debugging

### Real-time Log Monitoring

```bash
# Monitor all logs in real-time
Get-Content logs/*.log -Wait

# Monitor only error logs
Get-Content logs/error-*.log -Wait

# Monitor only info logs
Get-Content logs/info-*.log -Wait
```

### Log Analysis

```bash
# Count error logs
(Get-Content logs/error-*.log | Measure-Object).Count

# Find specific error patterns
Get-Content logs/error-*.log | Select-String "User not found"

# Find performance issues
Get-Content logs/info-*.log | Select-String "performance" | Select-String "ms"
```

### Browser Developer Tools

1. **Open browser developer tools** (F12)

2. **Go to Network tab**

3. **Make requests and check:**
   - Response status codes
   - Error response formats
   - Request/response timing

4. **Go to Console tab** to see:
   - Client-side error messages
   - JavaScript errors
   - API response details

## 📊 Expected Test Results

### ✅ Success Indicators

- [ ] Log files are created and populated
- [ ] HTTP requests are logged with response times
- [ ] Error responses follow consistent format
- [ ] Database errors are properly handled
- [ ] Authentication errors are logged
- [ ] Performance metrics are tracked
- [ ] Application recovers from errors gracefully

### ❌ Failure Indicators

- [ ] No log files created
- [ ] Errors not being caught
- [ ] Inconsistent error response formats
- [ ] Application crashes on errors
- [ ] Missing error context in logs
- [ ] Performance issues not tracked

## 🛠️ Troubleshooting

### Common Issues

1. **No log files created:**
   - Check if logs directory exists
   - Verify file permissions
   - Check for JavaScript errors

2. **Errors not being caught:**
   - Verify error handler is properly configured
   - Check middleware order in app.js
   - Ensure async error handling

3. **Inconsistent error formats:**
   - Check BaseController implementation
   - Verify error handler middleware
   - Test different error types

### Debug Commands

```bash
# Check if application is running
netstat -an | findstr :3000

# Check MongoDB connection
mongosh --eval "db.runCommand('ping')"

# Check log file permissions
ls -la logs/

# Monitor application logs
npm run dev
```

## 📈 Performance Testing

### Load Testing

1. **Install a load testing tool:**
   ```bash
   npm install -g artillery
   ```

2. **Create a simple test:**
   ```yaml
   # artillery-test.yml
   config:
     target: 'http://localhost:3000'
     phases:
       - duration: 60
         arrivalRate: 10
   scenarios:
     - name: "Test error handling"
       flow:
         - get:
             url: "/"
         - get:
             url: "/nonexistent"
   ```

3. **Run the test:**
   ```bash
   artillery run artillery-test.yml
   ```

4. **Check logs for:**
   - Request volume
   - Error rates
   - Performance metrics
   - Response times

## 🎯 Next Steps

After completing these tests:

1. **Review log files** for any issues
2. **Optimize error messages** based on user feedback
3. **Set up log monitoring** for production
4. **Implement log rotation** if needed
5. **Add more specific error handling** for edge cases

---

**Note**: This testing guide covers the most important aspects of the error handling and logging system. Adjust the tests based on your specific requirements and use cases.
