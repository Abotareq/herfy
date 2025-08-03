# Herfy Backend - E-commerce Platform API

A comprehensive Node.js/Express RESTful API for the Herfy handcraft e-commerce platform. This platform supports multi-vendor marketplace functionality with role-based access control, product management, order processing, and payment integration.

## 🚀 Features

### Core Features
- **Multi-vendor Marketplace**: Vendors can create stores and sell products
- **Role-based Access Control**: Admin, Vendor, and Customer roles
- **Authentication**: JWT-based auth with Google OAuth 2.0 integration
- **Product Management**: Products with variants, categories, and reviews
- **Shopping Cart**: Full cart functionality with quantity management
- **Order Processing**: Complete order lifecycle management
- **Payment Integration**: Stripe payment processing
- **Review System**: Product reviews and ratings
- **Coupon System**: Discount management
- **Search & Filtering**: Advanced product search and filtering
- **File Upload**: Cloudinary integration for image management

### Technical Features
- **MongoDB Atlas**: Cloud database with Mongoose ODM
- **Rate Limiting**: API request throttling
- **Error Handling**: Centralized error management
- **Validation**: Request validation with Joi
- **Security**: Helmet, CORS, and authentication middleware
- **Logging**: Morgan HTTP request logging

## 📁 Project Structure

```
herfy/
├── auth/                          # Authentication system
│   ├── auth.controller.js         # Auth controller (signup, signin, signout)
│   ├── auth.middleware.js         # JWT verification & role checking
│   ├── auth.routes.js             # Auth route definitions
│   ├── auth.utils.js              # Auth utility functions
│   └── google.passport.js         # Google OAuth strategy
├── controllers/                   # Business logic controllers
│   ├── cart.controller.js         # Shopping cart operations
│   ├── category.controller.js     # Category management
│   ├── cupon.controller.js        # Coupon operations
│   ├── filter.controller.js       # Product filtering
│   ├── order.controller.js        # Order processing
│   ├── payment.controller.js      # Payment handling
│   ├── product.controller.js      # Product CRUD operations
│   ├── review.controller.js       # Review management
│   ├── search.controller.js       # Product search
│   ├── store.controller.js        # Store management
│   └── user.controller.js         # User operations
├── middlewares/                   # Express middlewares
│   ├── async.wrapper.js          # Async error wrapper
│   ├── cloudinary.middleware.js   # Cloudinary upload
│   ├── error-handler.js          # Global error handler
│   ├── parseVariants.js          # Product variant parsing
│   ├── store.parse.js            # Store data parsing
│   ├── uploade.middleware.js     # File upload handling
│   └── validate.middleware.js    # Request validation
├── models/                       # Database schemas
│   ├── cartModel.js              # Shopping cart schema
│   ├── categoryModel.js          # Category schema
│   ├── cuponModel.js             # Coupon schema
│   ├── orderModel.js             # Order schema
│   ├── paymentModel.js           # Payment schema
│   ├── productModel.js           # Product schema
│   ├── reviewModel.js            # Review schema
│   ├── storeModel.js             # Store schema
│   └── userModel.js              # User schema
├── routes/                       # API route definitions
│   ├── cart.route.js             # Cart endpoints
│   ├── category.route.js         # Category endpoints
│   ├── cupon.route.js            # Coupon endpoints
│   ├── order.route.js            # Order endpoints
│   ├── payment.route.js          # Payment endpoints
│   ├── product.route.js          # Product endpoints
│   ├── review.route.js           # Review endpoints
│   ├── store.route.js            # Store endpoints
│   └── user.route.js             # User endpoints
├── services/                     # Business logic services
│   ├── cart.service.js           # Cart business logic
│   ├── coupon.service.js         # Coupon business logic
│   ├── order.service.js          # Order business logic
│   ├── payment.service.js        # Payment business logic
│   ├── product.service.js        # Product business logic
│   └── store.service.js          # Store business logic
├── utils/                        # Utility functions
│   ├── app.errors.js             # Custom error classes
│   ├── dbConnecion.js            # MongoDB connection
│   ├── error-model.js            # Error response model
│   ├── filter_method.js          # Filtering utilities
│   ├── http.status.message.js    # HTTP status constants
│   ├── sort.method.js            # Sorting utilities
│   ├── status.codes.js           # HTTP status codes
│   └── user.role.js              # User role constants
├── validations/                  # Request validation schemas
│   ├── cart.validation.js        # Cart validation
│   ├── custome.validation.js     # Custom validation
│   ├── order.validation.js       # Order validation
│   ├── payment.validation.js     # Payment validation
│   ├── product.validation.js     # Product validation
│   └── store.validation.js       # Store validation
├── uploads/                      # File upload directory
├── index.js                      # Application entry point
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing
- **Joi** - Request validation

### External Services
- **Google OAuth 2.0** - Social authentication
- **Stripe** - Payment processing
- **Cloudinary** - Image upload and management

### Security & Performance
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **Morgan** - HTTP request logging

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Google OAuth credentials
- Stripe account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abotareq/herfy.git
   cd herfy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI="mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority"
   JWT_SECRET="your-jwt-secret"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   
   # Stripe
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/signup` | User registration | Public |
| POST | `/api/auth/signin` | User login | Public |
| POST | `/api/auth/signout` | User logout | Private |
| GET | `/api/auth/google` | Google OAuth login | Public |
| GET | `/api/auth/google/callback` | Google OAuth callback | Public |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Private |
| PATCH | `/api/users/:id` | Update user | Private |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Store Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/store` | Get all stores | Public |
| POST | `/api/store` | Create store | Vendor |
| GET | `/api/store/:id` | Get store by ID | Public |
| PATCH | `/api/store/:id` | Update store | Owner/Admin |
| DELETE | `/api/store/:id` | Delete store | Owner/Admin |

### Product Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/product` | Get all products | Public |
| POST | `/api/product` | Create product | Vendor/Admin |
| GET | `/api/product/:id` | Get product by ID | Public |
| PATCH | `/api/product/:id` | Update product | Owner/Admin |
| DELETE | `/api/product/:id` | Delete product | Owner/Admin |
| GET | `/api/product/search` | Search products | Public |

### Category Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/category` | Get all categories | Public |
| POST | `/api/category` | Create category | Admin |
| GET | `/api/category/:id` | Get category by ID | Public |
| PATCH | `/api/category/:id` | Update category | Admin |
| DELETE | `/api/category/:id` | Delete category | Admin |

### Cart Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/cart` | Get user cart | Private |
| POST | `/api/cart` | Add item to cart | Private |
| PATCH | `/api/cart/:itemId` | Update cart item | Private |
| DELETE | `/api/cart/:itemId` | Remove cart item | Private |
| DELETE | `/api/cart` | Clear cart | Private |

### Order Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/order` | Get user orders | Private |
| POST | `/api/order` | Create order | Private |
| GET | `/api/order/:id` | Get order by ID | Private |
| PATCH | `/api/order/:id` | Update order status | Admin/Vendor |

### Payment Processing

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/payment/create-payment-intent` | Create payment intent | Private |
| POST | `/api/payment/confirm` | Confirm payment | Private |
| GET | `/api/payment` | Get payment history | Private |

### Review System

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/review/product/:productId` | Get product reviews | Public |
| POST | `/api/review/product/:productId` | Add product review | Private |
| PATCH | `/api/review/:reviewId` | Update review | Owner |
| DELETE | `/api/review/:reviewId` | Delete review | Owner/Admin |

### Coupon Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/coupon` | Get all coupons | Admin |
| POST | `/api/coupon` | Create coupon | Admin |
| POST | `/api/coupon/apply` | Apply coupon to cart | Private |
| DELETE | `/api/coupon/:id` | Delete coupon | Admin |

## 🔐 User Roles & Permissions

### Admin
- Full system access
- User management
- Store approval/rejection
- Category management
- Coupon management
- Order management

### Vendor
- Store management
- Product management
- Order fulfillment
- Review responses

### Customer
- Product browsing
- Cart management
- Order placement
- Review creation
- Profile management

## 🗄️ Database Schema

### Core Entities

**User**
- Personal information (name, email, phone)
- Role-based access (Admin, Vendor, Customer)
- Address management
- Wishlist functionality
- Google OAuth integration

**Store**
- Vendor-owned stores
- Location tracking (coordinates)
- Status management (pending, approved, rejected, suspended)
- Store policies and statistics

**Product**
- Product information (name, description, price)
- Category association
- Image management
- Variant support (size, color, etc.)
- Review aggregation
- Discount management

**Order**
- Order lifecycle management
- Payment integration
- Status tracking
- Delivery information

**Cart**
- User shopping cart
- Item quantity management
- Price calculations
- Coupon application

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `MONGO_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |

## 🚀 Deployment

### Production Considerations
- Use environment variables for sensitive data
- Set up proper CORS configuration
- Configure rate limiting for production
- Set up monitoring and logging
- Use HTTPS in production
- Configure proper MongoDB Atlas network access

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Herfy Backend** - Empowering handcraft vendors and customers with a robust e-commerce platform.
