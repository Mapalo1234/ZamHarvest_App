# Environment Setup Guide

This guide will help you set up the environment variables for the ZamHarvest marketplace application.

## Quick Setup

1. **Copy the example files:**
   ```bash
   # In the root directory
   cp env.example .env
   
   # In the backend directory
   cp backend/env.example backend/.env
   ```

2. **Edit the .env files with your actual values**

## Required Environment Variables

### Database Configuration
- `MONGODB_URI`: Your MongoDB connection string
  - Development: `mongodb://localhost:27017/ZamHarvestDB`
  - Production: `mongodb+srv://username:password@cluster.mongodb.net/ZamHarvestDB`

### Server Configuration
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment (development/production)

### Security
- `SESSION_SECRET`: Strong random string for session encryption
- `JWT_SECRET`: Strong random string for JWT tokens
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)

### Email Configuration (Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Set in .env:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: The generated app password

### ZynlePay Payment Gateway
1. Register at [ZynlePay](https://zynlepay.com)
2. Get your credentials from the dashboard
3. Set in .env:
   - `ZYNLEPAY_API_ID`: Your API ID
   - `ZYNLEPAY_MERCHANT_ID`: Your merchant ID
   - `ZYNLEPAY_API_KEY`: Your API key
   - `ZYNLEPAY_BASE_URL`: API endpoint URL

### Application URLs
- `BASE_URL`: Your application's base URL
- `FRONTEND_URL`: Frontend URL (usually same as BASE_URL)
- `VERIFICATION_BASE_URL`: URL for email verification links

## Security Notes

1. **Never commit .env files to version control**
2. **Use strong, unique secrets for production**
3. **Rotate secrets regularly**
4. **Use different credentials for development and production**

## Example .env Files

### Development (.env)
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ZamHarvestDB
PORT=3000
HOST=0.0.0.0
SESSION_SECRET=your-development-secret-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ZYNLEPAY_API_ID=your-api-id
ZYNLEPAY_MERCHANT_ID=your-merchant-id
ZYNLEPAY_API_KEY=your-api-key
BASE_URL=http://localhost:3000
```

### Production (.env)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ZamHarvestDB
PORT=3000
HOST=0.0.0.0
SESSION_SECRET=your-very-strong-production-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ZYNLEPAY_API_ID=your-api-id
ZYNLEPAY_MERCHANT_ID=your-merchant-id
ZYNLEPAY_API_KEY=your-api-key
BASE_URL=https://yourdomain.com
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify the connection string
   - Check network connectivity

2. **Email Not Sending**
   - Verify Gmail credentials
   - Check if 2FA is enabled
   - Use App Password, not regular password

3. **Payment Gateway Errors**
   - Verify ZynlePay credentials
   - Check API endpoint URL
   - Ensure account is active

4. **Session Issues**
   - Check SESSION_SECRET is set
   - Ensure it's the same across restarts
   - Use a strong, random string

## Next Steps

After setting up environment variables:

1. Install dependencies: `npm run install-all`
2. Start the development server: `npm run dev`
3. Access the application at `http://localhost:3000`

## Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all required environment variables are set
3. Ensure all services (MongoDB, etc.) are running
4. Check the troubleshooting section above
