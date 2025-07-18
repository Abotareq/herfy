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
