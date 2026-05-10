// controllers/authController.js - FIXED VERSION (ensures founders are saved in User collection)
const User = require('../models/User');
const Founder = require('../models/Founder'); // Import Founder model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userType: user.userType,
      banasthaliId: user.banasthaliId,
      email: user.email,
      fullName: user.fullName
    },
    process.env.JWT_SECRET || 'banasthali_startup_portal_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Register function - ENSURES founders are saved in User collection
const register = async (req, res) => {
  try {
    const {
      fullName,
      banasthaliId,
      email,
      password,
      phone,
      year,
      branch,
      userType,
      startupName,
      designation
    } = req.body;

    console.log('📝 Registration attempt:', {
      banasthaliId,
      email,
      userType,
      startupName
    });

    // Check if user exists in User collection
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { banasthaliId: banasthaliId.toUpperCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase()
          ? 'Email already registered'
          : 'Banasthali ID already registered'
      });
    }

    // ✅ CREATE USER FIRST in User collection (for ALL user types)
    const userData = {
      fullName,
      email: email.toLowerCase(),
      banasthaliId: banasthaliId.toUpperCase(),
      password,
      phone,
      userType: userType || 'student',
      isProfileComplete: false,
      isActive: true
    };

    // Add conditional fields based on user type
    if (userType === 'student') {
      userData.year = year;
      userData.branch = branch;
    } else if (userType === 'founder') {
      userData.startupName = startupName;
      if (year) userData.year = year;
      if (branch) userData.branch = branch;
    } else if (userType === 'admin') {
      userData.designation = designation;
    }

    // Save user to User collection
    const user = await User.create(userData);
    console.log('✅ User created in User collection:', {
      id: user._id,
      userType: user.userType,
      name: user.fullName
    });

    // ✅ IF USER IS FOUNDER: Also create Founder record
    let founder = null;
    if (userType === 'founder') {
      try {
        founder = await Founder.create({
          userId: user._id, // Link to User
          fullName: user.fullName,
          banasthaliId: user.banasthaliId,
          email: user.email,
          phone: user.phone,
          startupName: startupName,
          startupStage: 'Idea Stage',
          isProfileComplete: false,
          userType: 'founder',
          isActive: true,
          year: year || null,
          branch: branch || null
        });
        console.log('✅ Founder created in Founder collection:', founder._id);
        
        // ✅ Update the User record with founderId reference
        user.founderId = founder._id;
        await user.save();
        console.log('✅ Updated User with founderId:', user.founderId);
        
      } catch (founderError) {
        console.error('⚠️ Warning: Founder creation failed but User was created:', founderError);
        // Don't fail registration if founder creation fails
        // User can complete founder setup later
      }
    }

    // Generate token
    const token = generateToken(user);

    // Prepare response
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      banasthaliId: user.banasthaliId,
      email: user.email,
      userType: user.userType,
      phone: user.phone,
      isProfileComplete: user.isProfileComplete,
      isActive: user.isActive
    };

    // Add conditional fields to response
    if (user.userType === 'student') {
      userResponse.year = user.year;
      userResponse.branch = user.branch;
    } else if (user.userType === 'founder') {
      userResponse.startupName = user.startupName;
      if (founder) {
        userResponse.founderId = founder._id;
      }
    } else if (user.userType === 'admin') {
      userResponse.designation = user.designation;
    }

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: 'Registration successful!'
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// Login function - FIXED to check User collection
const login = async (req, res) => {
  try {
    const { banasthaliId, email, password } = req.body;

    console.log('🔑 Login attempt:', { banasthaliId, email });

    if (!banasthaliId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Banasthali ID, Email, and Password'
      });
    }

    // ✅ Find user in User collection
    const user = await User.findOne({
      banasthaliId: banasthaliId.toUpperCase(),
      email: email.toLowerCase()
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // ✅ If user is founder, get founder data
    let founderProfile = null;
    if (user.userType === 'founder') {
      founderProfile = await Founder.findOne({ userId: user._id });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Prepare response
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      banasthaliId: user.banasthaliId,
      email: user.email,
      userType: user.userType,
      phone: user.phone,
      isProfileComplete: user.isProfileComplete,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    };

    // Add conditional fields
    if (user.userType === 'student') {
      userResponse.year = user.year;
      userResponse.branch = user.branch;
    } else if (user.userType === 'founder') {
      userResponse.startupName = user.startupName;
      if (founderProfile) {
        userResponse.founderId = founderProfile._id;
      }
    } else if (user.userType === 'admin') {
      userResponse.designation = user.designation;
    }

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    // Find user in User collection
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If founder, get founder data
    let founderProfile = null;
    if (user.userType === 'founder') {
      founderProfile = await Founder.findOne({ userId: user._id });
    }

    // Prepare response
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      banasthaliId: user.banasthaliId,
      email: user.email,
      userType: user.userType,
      phone: user.phone,
      isProfileComplete: user.isProfileComplete,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    };

    // Add conditional fields
    if (user.userType === 'student') {
      userResponse.year = user.year;
      userResponse.branch = user.branch;
    } else if (user.userType === 'founder') {
      userResponse.startupName = user.startupName;
      if (founderProfile) {
        userResponse.founderId = founderProfile._id;
      }
    } else if (user.userType === 'admin') {
      userResponse.designation = user.designation;
    }

    res.status(200).json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Logout
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Test endpoint
const test = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth API is working',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  test
};