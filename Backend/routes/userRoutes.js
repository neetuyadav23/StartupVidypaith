const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ✅ CRITICAL: This route fixes the 404 error
// GET user by ID
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 [userRoutes] Fetching user by ID:', userId);
    
    // Find user by ID, exclude password
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check authorization
    const isOwner = req.user._id.toString() === userId;
    const isFounderViewingStudent = req.user.userType === 'founder' && user.userType === 'student';
    const isStudentViewingFounder = req.user.userType === 'student' && user.userType === 'founder';
    const isAdmin = req.user.userType === 'admin';
    
    // Allow: owner, founder viewing student, student viewing founder, or admin
    if (!isOwner && !isFounderViewingStudent && !isStudentViewingFounder && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this profile'
      });
    }
    
    // Format the response
    const userProfile = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      phone: user.phone || '',
      profileImage: user.profileImage || '',
      bio: user.bio || '',
      skills: user.skills || [],
      isProfileComplete: user.isProfileComplete || false,
      isActive: user.isActive || true,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    // Add student-specific fields
    if (user.userType === 'student') {
      userProfile.banasthaliId = user.banasthaliId || '';
      userProfile.branch = user.branch || '';
      userProfile.year = user.year || '';
      userProfile.resume = user.resume || '';
      userProfile.enrollmentNumber = user.banasthaliId || ''; // Using banasthaliId as enrollment number
    }
    
    // Add founder-specific fields
    if (user.userType === 'founder') {
      userProfile.startupName = user.startupName || '';
      userProfile.designation = user.designation || '';
    }
    
    // Add admin-specific fields
    if (user.userType === 'admin') {
      userProfile.designation = user.designation || '';
    }
    
    res.json({
      success: true,
      user: userProfile
    });
    
  } catch (error) {
    console.error('❌ [userRoutes] Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// GET current user profile
router.get('/me/profile', protect, (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// GET all users (for testing - optional)
router.get('/', protect, async (req, res) => {
  try {
    // Only allow admins to see all users
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Alternative profile route (for compatibility)
router.get('/profile/me', protect, (req, res) => {
  res.json({ 
    success: true,
    message: 'User profile route',
    user: req.user 
  });
});

module.exports = router;