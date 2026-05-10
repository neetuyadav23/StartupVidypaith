// routes/students.js - FULLY CORRECTED VERSION
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');
const Question = require('../models/Question');
const { protect: auth } = require('../middleware/authMiddleware');// FIXED: Using compatibility layer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ======================
// FILE UPLOAD CONFIGURATION
// ======================

// Create uploads directory if it doesn't exist
const createUploadsDir = () => {
  const dirs = ['uploads/profiles', 'uploads/resumes'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};
createUploadsDir();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, 'uploads/resumes/');
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/profiles/');
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});

// ======================
// HELPER FUNCTIONS
// ======================

// Helper function to calculate profile completion
function calculateProfileCompletion(user) {
  if (!user) return 0;
  
  const requiredFields = [
    { field: 'fullName', weight: 15 },
    { field: 'phone', weight: 10 },
    { field: 'branch', weight: 10 },
    { field: 'year', weight: 10 },
    { field: 'bio', weight: 15 },
    { field: 'skills', weight: 15, isArray: true },
    { field: 'profileImage', weight: 15 },
    { field: 'resume', weight: 10 }
  ];

  let totalScore = 0;
  let maxScore = 0;

  requiredFields.forEach(item => {
    maxScore += item.weight;
    
    if (user[item.field]) {
      if (item.isArray) {
        if (Array.isArray(user[item.field]) && user[item.field].length > 0) {
          totalScore += item.weight;
        }
      } else {
        if (user[item.field].toString().trim() !== '') {
          totalScore += item.weight;
        }
      }
    }
  });

  return Math.round((totalScore / maxScore) * 100);
}

// ======================
// STUDENT PROFILE ROUTES
// ======================

// GET student profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only students can access this profile.'
      });
    }

    const user = await User.findById(req.user._id)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate profile completion
    const profileCompletion = calculateProfileCompletion(user);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profileCompletion
      }
    });

  } catch (error) {
    console.error('❌ Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// UPDATE student profile
router.put('/profile', auth, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can update student profile'
      });
    }

    const { 
      fullName, 
      phone, 
      branch, 
      year, 
      bio, 
      skills, 
      enrollmentNumber,
      profileImage,
      resume
    } = req.body;

    // Validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Full name is required (minimum 2 characters)'
      });
    }

    if (!branch || branch.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Branch is required'
      });
    }

    if (!year || !['1', '2', '3', '4'].includes(year.toString())) {
      return res.status(400).json({
        success: false,
        error: 'Valid year is required (1-4)'
      });
    }

    const updateData = {
      fullName: fullName.trim(),
      branch: branch.trim(),
      year: year.toString().trim(),
      updatedAt: Date.now()
    };
    
    // Optional fields
    if (phone) updateData.phone = phone.trim();
    if (bio) updateData.bio = bio.trim();
    if (enrollmentNumber) updateData.enrollmentNumber = enrollmentNumber.trim();
    if (profileImage) updateData.profileImage = profileImage;
    if (resume) updateData.resume = resume;
    
    // Handle skills array
    if (skills) {
      updateData.skills = Array.isArray(skills) 
        ? skills.map(s => s.trim()).filter(s => s !== '')
        : skills.split(',').map(s => s.trim()).filter(s => s !== '');
    }
    
    // Check if profile is complete
    const isProfileComplete = updateData.fullName && updateData.phone && 
                              updateData.branch && updateData.year && 
                              updateData.bio && updateData.skills?.length > 0;
    
    if (isProfileComplete) {
      updateData.isProfileComplete = true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
      profileCompletion: calculateProfileCompletion(updatedUser)
    });

  } catch (error) {
    console.error('❌ Error updating student profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

// UPLOAD profile image
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can upload profile images'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        profileImage: imageUrl,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password -__v');

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl,
      user: updatedUser,
      profileCompletion: calculateProfileCompletion(updatedUser)
    });

  } catch (error) {
    console.error('❌ Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// UPLOAD resume
router.post('/upload-resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can upload resumes'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Check if file is PDF
    if (req.file.mimetype !== 'application/pdf') {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Only PDF files are allowed for resumes'
      });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        resume: resumeUrl,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password -__v');

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl,
      user: updatedUser,
      profileCompletion: calculateProfileCompletion(updatedUser)
    });

  } catch (error) {
    console.error('❌ Error uploading resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload resume'
    });
  }
});

// ======================
// STUDENT APPLICATIONS
// ======================

// GET student's applications
router.get('/applications', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view their applications'
      });
    }

    const applications = await Application.find({ studentId: req.user._id })
      .populate({
        path: 'founderId',
        select: 'fullName startupName profileImage email phone location bio skills'
      })
      .sort({ createdAt: -1 });

    // Transform the data for frontend
    const transformedApplications = applications.map(app => ({
      _id: app._id,
      startupName: app.founderId?.startupName || 'Unknown Startup',
      founderName: app.founderId?.fullName || 'Unknown Founder',
      profileImage: app.founderId?.profileImage || null,
      role: app.role,
      status: app.status,
      message: app.message,
      experience: app.experience,
      skills: app.skills,
      appliedDate: app.createdAt,
      updatedAt: app.updatedAt,
      responses: app.responses || []
    }));

    res.json({
      success: true,
      count: applications.length,
      applications: transformedApplications
    });

  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

// GET application by ID
router.get('/applications/:applicationId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const application = await Application.findOne({
      _id: req.params.applicationId,
      studentId: req.user._id
    })
    .populate({
      path: 'founderId',
      select: 'fullName startupName profileImage email phone location bio skills startupIndustry website'
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      application: {
        _id: application._id,
        startupName: application.founderId?.startupName || 'Unknown Startup',
        founderName: application.founderId?.fullName || 'Unknown Founder',
        founderImage: application.founderId?.profileImage || null,
        role: application.role,
        status: application.status,
        message: application.message,
        experience: application.experience,
        skills: application.skills,
        email: application.email,
        phone: application.phone,
        resume: application.resume,
        portfolio: application.portfolio,
        notes: application.notes,
        responses: application.responses || [],
        appliedDate: application.createdAt,
        updatedAt: application.updatedAt,
        founderInfo: {
          bio: application.founderId?.bio,
          industry: application.founderId?.startupIndustry,
          website: application.founderId?.website,
          location: application.founderId?.location,
          skills: application.founderId?.skills
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

// WITHDRAW application
router.put('/applications/:applicationId/withdraw', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can withdraw applications'
      });
    }

    const application = await Application.findOne({
      _id: req.params.applicationId,
      studentId: req.user._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        error: 'Application already withdrawn'
      });
    }

    if (application.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Cannot withdraw an accepted application'
      });
    }

    application.status = 'withdrawn';
    application.updatedAt = Date.now();
    await application.save();

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      application
    });

  } catch (error) {
    console.error('❌ Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw application'
    });
  }
});

// ======================
// STUDENT DASHBOARD DATA
// ======================

// GET student dashboard stats
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can access dashboard stats'
      });
    }

    // Fetch fresh user data
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get application counts
    const applications = await Application.find({ studentId: req.user._id });
    
    // Get recent applications (last 3)
    const recentApplications = await Application.find({ studentId: req.user._id })
      .populate({
        path: 'founderId',
        select: 'startupName profileImage'
      })
      .sort({ createdAt: -1 })
      .limit(3);

    // Calculate upcoming interviews (applications with status 'accepted' or 'interview_scheduled')
    const upcomingInterviews = applications.filter(app => 
      ['accepted', 'interview_scheduled'].includes(app.status)
    ).length;

    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      acceptedApplications: applications.filter(app => app.status === 'accepted').length,
      rejectedApplications: applications.filter(app => app.status === 'rejected').length,
      upcomingInterviews: upcomingInterviews,
      profileCompletion: calculateProfileCompletion(user),
      followedStartups: user.followedStartups?.length || 0
    };

    // Transform recent applications for frontend
    const transformedRecentApps = recentApplications.map(app => ({
      id: app._id,
      startupName: app.founderId?.startupName || 'Unknown Startup',
      role: app.role,
      status: app.status,
      appliedDate: app.createdAt.toISOString().split('T')[0],
      startupLogo: app.founderId?.profileImage || '/default-startup.png'
    }));

    res.json({
      success: true,
      stats,
      recentApplications: transformedRecentApps,
      user: {
        name: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
        branch: user.branch,
        year: user.year
      }
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// ======================
// STUDENT FOLLOW STARTUPS
// ======================

// GET followed startups
router.get('/followed-startups', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view followed startups'
      });
    }

    const user = await User.findById(req.user._id)
      .populate({
        path: 'followedStartups',
        select: 'fullName startupName profileImage bio location skills startupIndustry website',
        match: { userType: 'founder', isActive: true }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Transform the data
    const followedStartups = (user.followedStartups || []).map(founder => ({
      _id: founder._id,
      name: founder.startupName,
      founderName: founder.fullName,
      profileImage: founder.profileImage,
      bio: founder.bio,
      location: founder.location,
      industry: founder.startupIndustry,
      website: founder.website,
      skills: founder.skills,
      followerCount: founder.followers?.length || 0
    }));

    res.json({
      success: true,
      followedStartups,
      count: followedStartups.length
    });

  } catch (error) {
    console.error('❌ Error fetching followed startups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch followed startups'
    });
  }
});

// FOLLOW a startup (founder)
router.post('/follow/:founderId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can follow startups'
      });
    }

    const founder = await User.findById(req.params.founderId);
    
    if (!founder || founder.userType !== 'founder') {
      return res.status(404).json({
        success: false,
        error: 'Founder not found'
      });
    }

    // Check if already following
    const user = await User.findById(req.user._id);
    if (user.followedStartups && user.followedStartups.includes(founder._id)) {
      return res.status(400).json({
        success: false,
        error: 'Already following this startup'
      });
    }

    // Update both documents
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { followedStartups: founder._id }
    });

    await User.findByIdAndUpdate(founder._id, {
      $addToSet: { followers: req.user._id }
    });

    res.json({
      success: true,
      message: `Now following ${founder.startupName}`,
      founder: {
        _id: founder._id,
        name: founder.startupName,
        founderName: founder.fullName
      }
    });

  } catch (error) {
    console.error('❌ Error following startup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow startup'
    });
  }
});

// UNFOLLOW a startup
router.post('/unfollow/:founderId', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can unfollow startups'
      });
    }

    const founder = await User.findById(req.params.founderId);
    
    if (!founder) {
      return res.status(404).json({
        success: false,
        error: 'Founder not found'
      });
    }

    // Update both documents
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followedStartups: req.params.founderId }
    });

    await User.findByIdAndUpdate(founder._id, {
      $pull: { followers: req.user._id }
    });

    res.json({
      success: true,
      message: 'Unfollowed successfully',
      founder: {
        _id: founder._id,
        name: founder.startupName
      }
    });

  } catch (error) {
    console.error('❌ Error unfollowing startup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow startup'
    });
  }
});

// ======================
// STUDENT SKILLS MANAGEMENT
// ======================

// GET student skills
router.get('/skills', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view skills'
      });
    }

    const user = await User.findById(req.user._id).select('skills');
    
    res.json({
      success: true,
      skills: user?.skills || []
    });

  } catch (error) {
    console.error('❌ Error fetching skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skills'
    });
  }
});

// ADD skill
router.post('/skills', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can manage skills'
      });
    }

    const { skill } = req.body;

    if (!skill || !skill.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Skill is required'
      });
    }

    const trimmedSkill = skill.trim();
    
    // Check if skill already exists
    const user = await User.findById(req.user._id);
    if (user.skills && user.skills.includes(trimmedSkill)) {
      return res.status(400).json({
        success: false,
        error: 'Skill already exists'
      });
    }

    // Add skill
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { skills: trimmedSkill },
        updatedAt: Date.now()
      },
      { new: true }
    ).select('skills');

    res.json({
      success: true,
      message: 'Skill added successfully',
      skills: updatedUser.skills || []
    });

  } catch (error) {
    console.error('❌ Error adding skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add skill'
    });
  }
});

// REMOVE skill
router.delete('/skills/:skill', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can manage skills'
      });
    }

    // Decode the skill parameter
    const skillToRemove = decodeURIComponent(req.params.skill);

    // Update user by removing the skill
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { skills: skillToRemove },
        updatedAt: Date.now()
      },
      { new: true }
    ).select('skills');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill removed successfully',
      skills: updatedUser.skills || []
    });

  } catch (error) {
    console.error('❌ Error removing skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove skill'
    });
  }
});

// ======================
// STUDENT RECOMMENDATIONS
// ======================

// GET recommended startups based on skills
router.get('/recommendations', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can get recommendations'
      });
    }

    const user = await User.findById(req.user._id);
    const userSkills = user.skills || [];

    // If no skills, return empty recommendations
    if (userSkills.length === 0) {
      return res.json({
        success: true,
        recommendations: [],
        message: 'Add skills to get personalized recommendations'
      });
    }

    // Find active founders
    const founders = await User.find({ 
      userType: 'founder',
      isActive: true,
      startupName: { $exists: true, $ne: '' }
    }).select('fullName startupName profileImage bio skills location startupIndustry lookingFor hiring');

    // Calculate match scores
    const recommendations = founders.map(founder => {
      const founderSkills = founder.skills || [];
      const founderLookingFor = founder.lookingFor || [];
      
      // Find common skills
      const commonSkills = userSkills.filter(skill => 
        founderSkills.some(fSkill => 
          fSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(fSkill.toLowerCase())
        )
      );
      
      // Calculate match score (60% based on skills, 40% based on roles looking for)
      const skillMatchScore = founderSkills.length > 0 
        ? Math.round((commonSkills.length / founderSkills.length) * 60)
        : 0;
      
      // Check if student has skills that match what founder is looking for
      const roleMatchScore = founderLookingFor.length > 0 ? 40 : 0;
      
      const totalMatchScore = skillMatchScore + roleMatchScore;

      return {
        _id: founder._id,
        name: founder.startupName,
        founderName: founder.fullName,
        profileImage: founder.profileImage,
        bio: founder.bio,
        industry: founder.startupIndustry,
        location: founder.location,
        skills: founderSkills,
        lookingFor: founderLookingFor,
        hiring: founder.hiring || false,
        matchScore: totalMatchScore,
        commonSkills,
        isHiring: founder.hiring || false
      };
    })
    .filter(rec => rec.matchScore > 30) // Only show if match > 30%
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6); // Top 6 recommendations

    res.json({
      success: true,
      recommendations,
      userSkills
    });

  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// ======================
// STUDENT ACTIVITY & NOTIFICATIONS
// ======================

// GET student activity (questions asked, applications, etc.)
router.get('/activity', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view activity'
      });
    }

    // Get recent applications
    const recentApplications = await Application.find({ studentId: req.user._id })
      .populate({
        path: 'founderId',
        select: 'startupName'
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get questions asked
    const questionsAsked = await Question.find({ askedBy: req.user._id })
      .populate({
        path: 'founderId',
        select: 'startupName fullName'
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get profile updates (from user's updatedAt)
    const user = await User.findById(req.user._id);

    const activity = [
      // Profile update activity
      {
        type: 'profile_update',
        title: 'Profile Updated',
        description: 'You updated your profile information',
        timestamp: user.updatedAt,
        icon: '👤'
      },
      
      // Recent applications
      ...recentApplications.map(app => ({
        type: 'application',
        title: `Applied to ${app.founderId?.startupName || 'a startup'}`,
        description: `Role: ${app.role} | Status: ${app.status}`,
        timestamp: app.createdAt,
        icon: '📝'
      })),
      
      // Questions asked
      ...questionsAsked.map(q => ({
        type: 'question',
        title: `Asked a question to ${q.founderId?.fullName || 'a founder'}`,
        description: q.question.substring(0, 50) + (q.question.length > 50 ? '...' : ''),
        timestamp: q.createdAt,
        icon: '❓',
        isAnswered: q.isAnswered
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, 10); // Last 10 activities

    res.json({
      success: true,
      activity,
      counts: {
        applications: recentApplications.length,
        questions: questionsAsked.length,
        followedStartups: user.followedStartups?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
});

// ======================
// STUDENT ACHIEVEMENTS
// ======================

// GET student achievements
router.get('/achievements', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view achievements'
      });
    }

    const user = await User.findById(req.user._id);
    const applications = await Application.find({ studentId: req.user._id });
    const questions = await Question.find({ askedBy: req.user._id });

    const achievements = [];

    // Profile completion
    const profileCompletion = calculateProfileCompletion(user);
    if (profileCompletion >= 80) {
      achievements.push({
        id: 'profile_complete',
        title: 'Profile Perfectionist',
        description: 'Completed 80% or more of your profile',
        icon: '🏆',
        earned: true,
        progress: profileCompletion
      });
    }

    // First application
    if (applications.length >= 1) {
      achievements.push({
        id: 'first_application',
        title: 'First Step',
        description: 'Submitted your first application',
        icon: '🚀',
        earned: true,
        count: applications.length
      });
    }

    // 5 applications
    if (applications.length >= 5) {
      achievements.push({
        id: 'five_applications',
        title: 'Go Getter',
        description: 'Applied to 5 or more startups',
        icon: '🎯',
        earned: true,
        count: applications.length
      });
    }

    // First acceptance
    const acceptedApps = applications.filter(app => app.status === 'accepted');
    if (acceptedApps.length > 0) {
      achievements.push({
        id: 'first_acceptance',
        title: 'Hired!',
        description: 'Got your first acceptance',
        icon: '✅',
        earned: true,
        count: acceptedApps.length
      });
    }

    // Asked first question
    if (questions.length >= 1) {
      achievements.push({
        id: 'curious_mind',
        title: 'Curious Mind',
        description: 'Asked your first question to a founder',
        icon: '❓',
        earned: true,
        count: questions.length
      });
    }

    // Following startups
    if (user.followedStartups && user.followedStartups.length >= 3) {
      achievements.push({
        id: 'startup_follower',
        title: 'Startup Follower',
        description: 'Following 3 or more startups',
        icon: '⭐',
        earned: true,
        count: user.followedStartups.length
      });
    }

    res.json({
      success: true,
      achievements,
      totalEarned: achievements.filter(a => a.earned).length,
      totalPossible: 6
    });

  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
});

// ======================
// STUDENT SEARCH & DISCOVERY
// ======================

// SEARCH startups
router.get('/search-startups', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can search startups'
      });
    }

    const { query, industry, location, skills } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = {
      userType: 'founder',
      isActive: true,
      startupName: { $exists: true, $ne: '' }
    };

    // Text search
    if (query) {
      searchQuery.$or = [
        { startupName: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ];
    }

    // Filter by industry
    if (industry) {
      searchQuery.startupIndustry = { $regex: industry, $options: 'i' };
    }

    // Filter by location
    if (location) {
      searchQuery.location = { $regex: location, $options: 'i' };
    }

    // Filter by skills
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      searchQuery.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
    }

    // Execute search
    const founders = await User.find(searchQuery)
      .select('fullName startupName profileImage bio location startupIndustry skills lookingFor hiring')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchQuery);

    // Check which founders the student is already following
    const user = await User.findById(req.user._id).select('followedStartups');
    const followedStartupIds = user.followedStartups || [];

    const startups = founders.map(founder => ({
      _id: founder._id,
      name: founder.startupName,
      founderName: founder.fullName,
      profileImage: founder.profileImage,
      bio: founder.bio,
      location: founder.location,
      industry: founder.startupIndustry,
      skills: founder.skills,
      lookingFor: founder.lookingFor,
      hiring: founder.hiring,
      isFollowing: followedStartupIds.includes(founder._id),
      followerCount: founder.followers?.length || 0
    }));

    res.json({
      success: true,
      startups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error searching startups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search startups'
    });
  }
});

// ======================
// STUDENT SETTINGS
// ======================

// UPDATE student settings
router.put('/settings', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can update settings'
      });
    }

    const { emailNotifications, applicationAlerts, newsletter } = req.body;

    const updateData = {
      settings: {
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        applicationAlerts: applicationAlerts !== undefined ? applicationAlerts : true,
        newsletter: newsletter !== undefined ? newsletter : false
      },
      updatedAt: Date.now()
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('settings');

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedUser.settings || {}
    });

  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// DELETE student account (soft delete)
router.delete('/account', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can delete their account'
      });
    }

    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'Please type DELETE to confirm account deletion'
      });
    }

    // Soft delete - mark as inactive
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      deactivatedAt: Date.now()
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Students API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /profile - Get student profile',
      'PUT /profile - Update student profile',
      'POST /upload-image - Upload profile image',
      'POST /upload-resume - Upload resume',
      'GET /applications - Get student applications',
      'GET /dashboard-stats - Get dashboard statistics',
      'GET /followed-startups - Get followed startups',
      'POST /follow/:founderId - Follow a startup',
      'GET /recommendations - Get startup recommendations'
    ]
  });
});

// ======================
// EXPORT
// ======================

module.exports = router;