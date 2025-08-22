import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import StatusCodes from "../utils/status.codes.js";
import ErrorResponse from "../utils/error-model.js";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return next(
        new ErrorResponse("No token. Unauthorized.", StatusCodes.UNAUTHORIZED)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(
        new ErrorResponse(
          "User not found. Unauthorized.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse("Token invalid or expired.", StatusCodes.UNAUTHORIZED));
  }
};

/**
 * Middleware to check if user's role is allowed
 * @param {Array} allowedRoles - Array of roles, e.g., ['admin', 'vendor']
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          "Forbidden: Insufficient permissions",
          StatusCodes.FORBIDDEN
        )
      );
    }
    next();
  };
};

//*! osama saad

// export const optionalAuth = (req, res, next) => {
//     const token = req.cookies.access_token;

//   if (token) {
//     const token = authHeader.split(' ')[1];
//     try {
//       // Verify the token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET); 
//       // Attach the user to the request object
//       req.user = decoded; 
//     } catch (err) {
//       // If token is invalid (expired, etc.), just ignore it and proceed
//       // req.user will remain undefined
//     }
//   }
  
//   // Proceed to the next middleware/controller regardless
//   next();
// };


// export const optionalAuth = async (req, res, next) => {
//   try {
//     const token = req.cookies.access_token;
//     if (!token) {

    
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//     }

//     req.user = user;
//     next();
//   } catch (err) {
//     return next(new ErrorResponse("Token invalid or expired.", StatusCodes.UNAUTHORIZED));
//   }
// };



export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    // If there's a token, try to verify it
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      // If the user exists, attach them to the request
      if (user) {
        req.user = user;
      }
    }
    // Whether a user was found or not, proceed to the controller
    return next();
  } catch (err) {
    // If the token is invalid/expired, just ignore it and proceed.
    // The user will simply not be authenticated.
    return next();
  }
};