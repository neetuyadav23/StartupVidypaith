#!/bin/bash

echo " Setting up Banasthali Startup Portal Backend..."

# Create backend folder if it doesn't exist
mkdir -p backend

# Navigate to backend
cd backend

echo " Creating folder structure..."
mkdir -p database controllers models routes middleware utils

echo " Initializing npm project..."
npm init -y

echo " Installing dependencies..."
npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet morgan express-rate-limit express-validator
npm install -D nodemon

echo "Creating configuration files..."

# Create .env file
cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/banasthali_startup

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo " .env file created"

# Create database/database.js
cat > database/database.js << 'EOF'
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banasthali_startup', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    console.log(' Troubleshooting Tips:');
    console.log('1. Make sure MongoDB is running locally or Atlas URL is correct');
    console.log('2. Check if MongoDB service is started (run: mongod)');
    console.log('3. Verify your connection string in .env file');
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log(' Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.log(` Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log(' Mongoose disconnected');
});

// Close the connection when app terminates
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(' Mongoose connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
EOF

echo " database/database.js created"

# Create package.json with updated scripts
cat > package.json << 'EOF'
{
  "name": "banasthali-startup-backend",
  "version": "1.0.0",
  "description": "Backend API for Banasthali Startup Portal",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["banasthali", "startup", "portal", "api"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "express-rate-limit": "^6.10.0",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

echo " package.json updated"

# Create server.js
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const connectDB = require('./database/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus] || 'unknown';

  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Banasthali Startup Portal API',
    database: dbStatusText,
    uptime: process.uptime()
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Banasthali Startup Portal API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      },
      users: 'GET /api/users'
    },
    documentation: 'See README.md for more details'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(' Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API URL: http://localhost:${PORT}/api`);
  console.log(` Health check: http://localhost:${PORT}/health`);
});
EOF

echo " server.js created"

# Create basic route files
cat > routes/authRoutes.js << 'EOF'
const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
EOF

echo " routes/authRoutes.js created"

cat > controllers/authController.js << 'EOF'
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { fullName, banasthaliId, password, branch, year, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ banasthaliId });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this Banasthali ID'
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      banasthaliId,
      password,
      branch,
      year,
      phone
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        banasthaliId: user.banasthaliId,
        email: user.email,
        userType: user.userType,
        branch: user.branch,
        year: user.year
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { banasthaliId, password } = req.body;

    // Check for user
    const user = await User.findOne({ banasthaliId }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        banasthaliId: user.banasthaliId,
        email: user.email,
        userType: user.userType,
        branch: user.branch,
        year: user.year,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// Logout user
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
EOF

echo "controllers/authController.js created"

cat > models/User.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters']
  },
  
  banasthaliId: {
    type: String,
    required: [true, 'Please provide your Banasthali ID'],
    unique: true,
    trim: true,
    match: [/^[a-zA-Z]{5}\d{5}$/, 'Please provide a valid Banasthali ID (5 letters + 5 numbers)']
  },
  
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  userType: {
    type: String,
    enum: ['student', 'founder', 'admin'],
    default: 'student'
  },
  
  branch: {
    type: String,
    required: [true, 'Please provide your branch/department']
  },
  
  year: {
    type: String,
    required: [true, 'Please provide your current year'],
    enum: ['1st', '2nd', '3rd', '4th', '5th', 'Alumni']
  },
  
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number']
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email from Banasthali ID
UserSchema.pre('save', function(next) {
  if (this.isModified('banasthaliId') || !this.email) {
    this.email = `${this.banasthaliId.toLowerCase()}@banasthali.in`;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
EOF

echo " models/User.js created"

cat > middleware/authMiddleware.js << 'EOF'
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.userType} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
EOF

echo " middleware/authMiddleware.js created"

# Create README.md
cat > README.md << 'EOF'
# Banasthali Startup Portal - Backend API

## 
 Quick Start

### 1. Install Dependencies
```bash
npm install