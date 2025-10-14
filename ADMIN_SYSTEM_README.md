# ZamHarvest Admin System

## Overview
The ZamHarvest Admin System provides comprehensive management capabilities for the agricultural marketplace platform. It includes user management, product oversight, order processing, analytics, and system configuration.

## 🚀 Quick Start

### 1. Create Admin User
```bash
cd mongobdLogin/backend
npm run create-admin
```

This creates a default admin user:
- **Email**: admin@zamharvest.com
- **Password**: admin123
- **Role**: Super Admin

⚠️ **Important**: Change the password after first login!

### 2. Access Admin Dashboard
1. Start the server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/login`
3. Login with the admin credentials

## 📁 File Structure

```
mongobdLogin/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── admin.js                    # Admin user model
│   │   ├── controllers/
│   │   │   ├── AdminController.js          # Admin authentication
│   │   │   └── AdminManagementController.js # Management operations
│   │   ├── middleware/
│   │   │   └── adminAuth.js                # Admin authentication middleware
│   │   ├── routes/
│   │   │   └── adminRoutes.js              # Admin API routes
│   │   └── scripts/
│   │       └── createAdmin.js              # Create admin user script
├── frontend/
│   ├── templates/admin/
│   │   ├── login.hbs                       # Admin login page
│   │   └── dashboard.hbs                   # Admin dashboard
│   ├── public/css/admin/
│   │   └── admin.css                       # Admin styles
│   └── public/js/admin/
│       └── admin.js                        # Admin JavaScript
```

## 🔐 Authentication & Authorization

### Admin Roles
- **Super Admin**: Full access to all features
- **Admin**: Standard administrative access
- **Moderator**: Limited access to content moderation

### Permissions
- `user_management`: Manage users (activate/deactivate)
- `product_management`: Manage products (approve/reject)
- `order_management`: Process orders and disputes
- `analytics_view`: View analytics and reports
- `settings_management`: Configure system settings
- `content_moderation`: Moderate content and reviews
- `financial_reports`: Access financial data
- `system_configuration`: System-wide configuration

## 🎯 Features

### 1. Dashboard Overview
- Real-time statistics
- Revenue tracking
- User growth charts
- Recent orders
- Pending actions

### 2. User Management
- View all users (buyers/sellers)
- Search and filter users
- Activate/deactivate accounts
- View user details
- Export user data

### 3. Product Management
- View all products
- Approve/reject products
- Search and filter products
- Category management
- Stock monitoring

### 4. Order Management
- View all orders
- Update order status
- Process refunds
- Dispute resolution
- Order analytics

### 5. Analytics & Reports
- User analytics
- Product performance
- Revenue analysis
- Growth metrics
- Custom reports

### 6. System Settings
- Platform configuration
- Commission rates
- Email settings
- Feature toggles
- Security settings

## 🛠️ API Endpoints

### Authentication
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `GET /admin/check-auth` - Check authentication status

### Dashboard
- `GET /admin/dashboard/stats` - Get dashboard statistics

### User Management
- `GET /admin/users` - Get all users
- `PUT /admin/users/:userId/status` - Toggle user status

### Product Management
- `GET /admin/products` - Get all products
- `PUT /admin/products/:productId/status` - Toggle product status

### Order Management
- `GET /admin/orders` - Get all orders
- `PUT /admin/orders/:orderId/status` - Update order status

### Analytics
- `GET /admin/analytics` - Get analytics data

### Settings
- `GET /admin/settings` - Get system settings
- `PUT /admin/settings` - Update system settings

## 🎨 UI Components

### Admin Login
- Clean, professional login form
- Error handling and validation
- Responsive design

### Admin Dashboard
- Modern, intuitive interface
- Real-time data updates
- Interactive charts and graphs
- Mobile-responsive design

### Data Tables
- Advanced search and filtering
- Pagination support
- Bulk actions
- Export functionality

## 🔧 Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Admin Configuration
ADMIN_SESSION_SECRET=your-admin-session-secret
ADMIN_SESSION_MAX_AGE=86400000
```

### Database
The admin system uses the same MongoDB database as the main application. Admin users are stored in the `admins` collection.

## 🚨 Security Features

### Authentication
- Secure password hashing (bcrypt)
- Session-based authentication
- Automatic session timeout

### Authorization
- Role-based access control
- Permission-based feature access
- Route protection middleware

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📊 Monitoring & Logging

### Activity Logging
- Admin login/logout events
- User management actions
- Product approval/rejection
- Order status changes
- System configuration changes

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Debug information in development

## 🚀 Deployment

### Production Setup
1. Set secure environment variables
2. Configure proper database connections
3. Set up SSL certificates
4. Configure reverse proxy
5. Set up monitoring and logging

### Security Checklist
- [ ] Change default admin password
- [ ] Configure secure session settings
- [ ] Set up HTTPS
- [ ] Configure firewall rules
- [ ] Set up backup procedures
- [ ] Configure monitoring alerts

## 🐛 Troubleshooting

### Common Issues

1. **Admin login fails**
   - Check if admin user exists
   - Verify password
   - Check database connection

2. **Permission denied errors**
   - Check admin role and permissions
   - Verify route protection middleware

3. **Dashboard data not loading**
   - Check API endpoints
   - Verify database queries
   - Check browser console for errors

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=admin:*
```

## 📈 Performance Optimization

### Database
- Proper indexing on frequently queried fields
- Pagination for large datasets
- Aggregation pipelines for analytics

### Frontend
- Lazy loading for large datasets
- Caching for static data
- Optimized chart rendering

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor admin activity logs
- Review user management actions
- Update system settings as needed
- Backup admin data

### Security Updates
- Keep dependencies updated
- Monitor security advisories
- Regular security audits

## 📞 Support

For admin system support:
1. Check the troubleshooting section
2. Review error logs
3. Contact system administrator
4. Create issue in project repository

---

*This admin system provides comprehensive management capabilities for the ZamHarvest marketplace platform. Regular updates and security patches ensure optimal performance and security.*
