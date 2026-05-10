// middleware/authMiddleware.js - UPDATED AND CORRECTED VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in multiple locations
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Note: For cookies to work, you need cookie-parser middleware in server.js
      token = req.cookies.token;
    } else if (req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this route. Please login first.' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'banasthali_startup_portal_secret_key_change_in_production'
      );
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }
      
      // Check if user is active (if isActive field exists)
      if (user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }
      
      // Extract user info from database (more reliable than token)
      req.userId = user._id;
      req.userType = user.role || user.userType; // Use both for compatibility
      req.banasthaliId = user.banasthaliId;
      req.email = user.email;
      
      // Add user to request object
      req.user = user;
      
      // Update last login time (in background, don't wait for it)
      // Make sure your User model has lastLogin field
      if (user.lastLogin !== undefined) {
        User.findByIdAndUpdate(user._id, { 
          lastLogin: new Date() 
        }, { new: true }).catch(err => 
          console.error('Error updating last login:', err)
        );
      }
      
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid authentication token' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Your session has expired. Please login again.' 
        });
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this resource' 
      });
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error in authentication system' 
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedTypes) => {
  return (req, res, next) => {
    // First check if protect middleware ran successfully
    if (!req.userType) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Run protect middleware first.'
      });
    }
    
    if (!allowedTypes.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.userType} role cannot access this resource.`
      });
    }
    next();
  };
};

// Middleware to verify if user is verified (email verification)
const requireVerified = (req, res, next) => {
  // First check if protect middleware ran
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated. Run protect middleware first.'
    });
  }
  
  // Check if user is verified (check both possible field names)
  if (req.user.isVerified === false || req.user.verified === false) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this feature'
    });
  }
  
  next();
};

// Middleware to check if user has specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    // First check if protect middleware ran
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Run protect middleware first.'
      });
    }
    
    // Admin has all permissions
    if (req.user.role === 'admin' || req.user.userType === 'admin') {
      return next();
    }
    
    // Founder-specific permissions
    if ((req.user.role === 'founder' || req.user.userType === 'founder') && 
        permission.startsWith('founder:')) {
      return next();
    }
    
    // Student-specific permissions
    if ((req.user.role === 'student' || req.user.userType === 'student') && 
        permission.startsWith('student:')) {
      return next();
    }
    
    // Mentor-specific permissions
    if ((req.user.role === 'mentor' || req.user.userType === 'mentor') && 
        permission.startsWith('mentor:')) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  };
};

// Optional: Add a simpler auth check for non-critical routes
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'banasthali_startup_portal_secret_key_change_in_production'
        );
        
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          req.userId = user._id;
          req.userType = user.role || user.userType;
          req.banasthaliId = user.banasthaliId;
          req.email = user.email;
        }
      } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed (non-critical):', error.message);
      }
    }
    
    next();
  } catch (error) {
    next(); // Always continue for optional auth
  }
};

module.exports = { 
  protect, 
  authorize, 
  requireVerified,
  requirePermission,
  optionalAuth 
};