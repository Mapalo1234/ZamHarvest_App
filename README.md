# ZamHarvest Marketplace

A full-stack agricultural marketplace application connecting buyers and sellers of agricultural products.

## Project Structure

```
zamharvest-marketplace/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── models/         # Database models (Mongoose schemas)
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── index.js        # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # Frontend application
│   ├── public/            # Static assets
│   │   ├── css/          # Stylesheets
│   │   ├── js/           # JavaScript files
│   │   ├── image/        # Images
│   │   └── all/          # Font Awesome assets
│   ├── templates/        # Handlebars templates
│   └── package.json      # Frontend dependencies
├── package.json           # Root package.json
└── README.md             # This file
```

## Features

- **User Authentication**: Email verification, role-based access (buyer/seller)
- **Product Management**: CRUD operations for agricultural products
- **Order System**: Order creation, tracking, and management
- **Payment Integration**: ZynlePay payment gateway
- **Search & Filter**: Product search and pagination
- **Responsive Design**: Mobile-friendly interface

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## Development

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: Handlebars, Vanilla JavaScript, CSS3
- **Authentication**: Express Sessions, bcrypt
- **Email**: Nodemailer
- **Payment**: ZynlePay API

## Environment Setup

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/ZamHarvestDB
SESSION_SECRET=your-strong-secret-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ZYNLEPAY_API_ID=your-api-id
ZYNLEPAY_MERCHANT_ID=your-merchant-id
ZYNLEPAY_API_KEY=your-api-key
```

## API Endpoints

- `GET /` - Home page
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /products` - Get products
- `POST /submit-product` - Create product (sellers only)
- `POST /create-order` - Create order (buyers only)
- `POST /pay` - Process payment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
