import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';


export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ error: 'No token. Unauthorized.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found. Unauthorized.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired.' });
  }
};

/**
 * Middleware to check if user's role is allowed
 * @param {Array} allowedRoles - Array of roles, e.g., ['admin', 'vendor']
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
