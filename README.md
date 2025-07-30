# Herfy Backend

Herfy Backend is a Node.js/Express-based RESTful API that powers the backend for the Herfy handcraft platform. It handles user authentication (including Google OAuth), role-based access control, product handling, and more.

---

# First: Project Structure:
HERFY-BACKEND/
├── auth/ # Google OAuth2 & Passport.js strategies
├── controllers/ # Route controllers for business logic
├── middlewares/ # Error handling, auth checks, etc.
├── models/ # Mongoose schemas
├── node_modules/
├── routes/ # Express route handlers
├── services/ # External services (e.g., payment, mail)
├── utils/ # Utility functions (e.g., token generator)
├── validations/ # Joi or Zod validation schemas
├── .env # Environment variables
├── index.js # App entry point
├── package.json # Project metadata and dependencies
├── README.md # Project documentation

## Second: Features

-  User authentication (Signup, Signin, Signout)
-  Google Sign-In (OAuth 2.0 via Passport.js)
-  Role-based access control (Admin, Vendor, Customer)
-  Wishlist and Address management
-  Centralized error handling and validation
-  Token-based auth using HTTP-only cookies

## Third: Technologies Used

- **Node.js** & **Express**
- **MongoDB** with **Mongoose**
- **Passport.js** (Google OAuth 2.0 Strategy)
- **JWT** for token generation
- **Joi**/**Zod** for request validation
- **dotenv**, **cookie-parser**, **bcryptjs**



