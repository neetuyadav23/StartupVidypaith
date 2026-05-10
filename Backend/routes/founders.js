// routes/founders.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const Founder = require('../models/Founder');
const User = require('../models/User');

// ✅ POST endpoint for creating/updating founder profile (MAIN ENDPOINT)
router.post('/profile', async (req, res) => {
  try {
    const { userId, ...founderData } = req.body;
    
    console.log('📥 POST /profile received - User ID:', userId);
    console.log('📦 Founder data:', founderData);
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    // Check if user exists (optional, for debugging)
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.log('⚠️ User not found in database, but continuing...');
      } else {
        console.log('✅ User found:', user.email);
      }
    } catch (userError) {
      console.log('⚠️ Could not check user:', userError.message);
    }
    
    // Check if founder profile already exists for this user
    let founder = await Founder.findOne({ userId });
    
    if (founder) {
      console.log('🔄 Updating existing founder profile:', founder._id);
      // Update existing founder
      Object.keys(founderData).forEach(key => {
        if (founderData[key] !== undefined) {
          founder[key] = founderData[key];
        }
      });
      founder.updatedAt = new Date();
    } else {
      console.log('🆕 Creating new founder profile for user:', userId);
      // Create new founder record
      founder = new Founder({
        userId,
        ...founderData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Save to database
    const savedFounder = await founder.save();
    console.log('💾 Founder saved to DB with ID:', savedFounder._id);
    
    // Update user to mark as founder profile complete
    try {
      await User.findByIdAndUpdate(userId, { 
        profileComplete: true,
        updatedAt: new Date()
      });
    } catch (updateError) {
      console.log('⚠️ Could not update user:', updateError.message);
    }
    
    res.json({
      success: true,
      message: founder._id ? 'Founder profile updated' : 'Founder profile created',
      founder: savedFounder
    });
    
  } catch (error) {
    console.error('❌ Error in POST /profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving founder profile', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ PUT endpoint for direct founder ID updates
router.put('/:founderId/profile', async (req, res) => {
  try {
    const { founderId } = req.params;
    const profileData = req.body;
    
    console.log('📥 PUT /:founderId/profile - Founder ID:', founderId);
    console.log('📦 Profile data:', profileData);
    
    // Find founder by ID
    let founder = await Founder.findById(founderId);
    
    if (!founder) {
      // If founder not found, create new one with this ID
      console.log('🆕 Creating new founder with ID:', founderId);
      founder = new Founder({
        _id: founderId,
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update existing founder
      console.log('🔄 Updating existing founder:', founderId);
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined) {
          founder[key] = profileData[key];
        }
      });
      founder.updatedAt = new Date();
    }
    
    await founder.save();
    
    res.json({
      success: true,
      message: 'Founder profile saved successfully',
      founder: founder
    });
    
  } catch (error) {
    console.error('Error saving founder profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving founder profile',
      error: error.message
    });
  }
});

// ✅ Get all founders (for debugging)
router.get('/', async (req, res) => {
  try {
    const founders = await Founder.find({});
    console.log(`📊 Found ${founders.length} founders in database`);
    
    res.json({
      success: true,
      count: founders.length,
      founders: founders
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching founders', 
      error: error.message 
    });
  }
});

// ✅ Get founder profile by ID
router.get('/:founderId', async (req, res) => {
  try {
    const founder = await Founder.findById(req.params.founderId);
    
    if (!founder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Founder profile not found' 
      });
    }
    
    res.json({
      success: true,
      founder: founder
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching founder profile', 
      error: error.message 
    });
  }
});

// ✅ Get founder profile by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const founder = await Founder.findOne({ userId: req.params.userId });
    
    if (!founder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Founder profile not found for this user' 
      });
    }
    
    res.json({
      success: true,
      founder: founder
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching founder profile', 
      error: error.message 
    });
  }
});

// ✅ Test endpoint
router.get('/test/connection', (req, res) => {
  res.json({
    success: true,
    message: 'Founders API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /profile - Create/update founder profile',
      'PUT /:founderId/profile - Update by founder ID',
      'GET / - Get all founders',
      'GET /:founderId - Get founder by ID',
      'GET /user/:userId - Get founder by user ID'
    ]
  });
});

module.exports = router;