// Authentication and authorization middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies JWT from Authorization header and loads the user onto req.user
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(payload.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // Attach the user to the request for downstream handlers
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Ensures the authenticated user has one of the allowed roles
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
