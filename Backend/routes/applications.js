const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const checkExistingApplication = require('../middleware/checkExistingApplication');
const nodemailer = require('nodemailer');

// ==================== REAL EMAIL SENDER ====================
const sendApplicationEmail = async (studentEmail, studentName, founderName, startupName, role, status, customMessage = '') => {
  try {
    // Check if email credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Email credentials missing, logging to console instead');
      console.log(`Would send email to: ${studentEmail}`);
      console.log(`Subject: Application ${status} for ${role} at ${startupName}`);
      return false;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Determine email subject and content based on status
    let subject, message;
    
    switch (status.toLowerCase()) {
      case 'accepted':
        subject = `🎉 Congratulations! Your application has been accepted - ${startupName}`;
        message = customMessage || `Dear ${studentName},\n\nWe are thrilled to inform you that your application for the "${role}" position at ${startupName} has been ACCEPTED by ${founderName}!\n\nThis is an exciting opportunity, and we believe your skills will be a great addition to our team.\n\n${founderName} will contact you shortly to discuss the next steps, which may include an interview, onboarding details, or project discussions.\n\nCongratulations once again!\n\nBest regards,\nThe ${startupName} Team`;
        break;
      case 'rejected':
        subject = `Update regarding your application for ${role} at ${startupName}`;
        message = customMessage || `Dear ${studentName},\n\nThank you for taking the time to apply for the "${role}" position at ${startupName} and for your interest in joining our team.\n\nAfter careful consideration, we regret to inform you that we have decided not to move forward with your application at this time. This decision was made by ${founderName} after reviewing all applicants.\n\nWe received many applications for this position, and the selection process was quite competitive. While your qualifications are impressive, we have chosen to pursue other candidates whose experience more closely matches our current needs.\n\nWe encourage you to apply for future opportunities with us, and we wish you the very best in your job search and future endeavors.\n\nThank you again for your interest in ${startupName}.\n\nBest regards,\n${founderName}\n${startupName}`;
        break;
      case 'pending':
        subject = `Your application is under review - ${startupName}`;
        message = customMessage || `Dear ${studentName},\n\nThis is to confirm that your application for the "${role}" position at ${startupName} has been received and is currently under review by ${founderName}.\n\nWe appreciate your patience during this process. Our team will carefully evaluate all applications, and we aim to get back to you within a reasonable timeframe.\n\nYou will be notified as soon as a decision has been made regarding your application.\n\nThank you for your interest in joining ${startupName}!\n\nBest regards,\nThe ${startupName} Team`;
        break;
      default:
        subject = `Application Update - ${startupName}`;
        message = customMessage || `Dear ${studentName},\n\nYour application status for the "${role}" position at ${startupName} has been updated to "${status}".\n\nIf you have any questions, please feel free to reach out to ${founderName}.\n\nBest regards,\n${startupName}`;
    }

    // Email options
    const mailOptions = {
      from: `"Banasthali Startup Portal" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Banasthali Startup Portal</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Application Status Update</p>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #666;">
                <strong>Applicant:</strong> ${studentName}<br>
                <strong>Startup:</strong> ${startupName}<br>
                <strong>Role:</strong> ${role}<br>
                <strong>Status:</strong> <span style="color: ${
                  status === 'accepted' ? '#28a745' : 
                  status === 'rejected' ? '#dc3545' : 
                  '#ffc107'
                }; font-weight: bold;">${status.toUpperCase()}</span>
              </p>
            </div>
            
            <div style="white-space: pre-line; line-height: 1.6; color: #444; margin: 25px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                This is an automated message from the Banasthali Startup Portal.<br>
                Please do not reply to this email directly.<br>
                Contact ${founderName} for any questions regarding your application.
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${studentEmail}: ${info.messageId}`);
    
    // Also log to console for debugging
    console.log('\n📧 ========== EMAIL SENT ==========');
    console.log(`TO: ${studentEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`STATUS: ${status.toUpperCase()}`);
    console.log(`MESSAGE ID: ${info.messageId}`);
    console.log('====================================\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    // Don't fail the whole request if email fails
    console.log('⚠️ Email failed but continuing with application update...');
    return false;
  }
};

// ==================== USER PROFILE ROUTE ====================
// Add this route to fix the 404 error when viewing applicant profiles
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 Fetching user profile for ID:', userId);
    
    // Find user by ID, exclude password
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpire -__v')
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
    
    if (!isOwner && !isFounderViewingStudent) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this profile'
      });
    }
    
    // Format response based on user type
    let profileData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      phone: user.phone || 'Not provided',
      profileImage: user.profileImage || '',
      bio: user.bio || '',
      skills: user.skills || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    // Add student-specific fields
    if (user.userType === 'student') {
      profileData = {
        ...profileData,
        banasthaliId: user.banasthaliId,
        branch: user.branch || 'Not specified',
        year: user.year || 'Not specified',
        resume: user.resume || '',
        isProfileComplete: user.isProfileComplete || false
      };
    }
    
    // Add founder-specific fields
    if (user.userType === 'founder') {
      profileData = {
        ...profileData,
        startupName: user.startupName || 'Not specified',
        startupDescription: user.bio || '' // Using bio for startup description
      };
    }
    
    res.json({
      success: true,
      user: profileData
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Applications route is working!',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== APPLICATION ROUTES ====================

// POST: Apply for a role
router.post('/', protect, checkExistingApplication, async (req, res) => {
  try {
    const { founderId, role, message, experience, skills, email, phone, resume, portfolio } = req.body;
    const studentId = req.user._id;
    
    console.log('📝 New application attempt:', {
      studentId,
      studentName: req.user.fullName,
      founderId,
      role
    });
    
    // Check if user is trying to apply to themselves
    if (founderId === studentId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot apply to your own startup'
      });
    }
    
    // Check if user is a founder (prevent founders from applying)
    if (req.user.userType === 'founder') {
      return res.status(403).json({
        success: false,
        error: 'Founders cannot apply for positions. You can only post positions for others to apply.'
      });
    }
    
    // Check if founder exists
    const founder = await User.findById(founderId);
    if (!founder) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found'
      });
    }
    
    // Check if user is a student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can apply for positions'
      });
    }
    
    // Create application
    const application = new Application({
      studentId,
      founderId,
      role,
      message: message || 'No message provided',
      experience: experience || '',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      email: email || req.user.email,
      phone: phone || req.user.phone,
      resume: resume || req.user.resume,
      portfolio: portfolio || '',
      status: 'pending'
    });
    
    await application.save();
    
    console.log(`✅ Application created: ${application._id}`);
    console.log(`   Student: ${req.user.fullName}`);
    console.log(`   Startup: ${founder.startupName || 'Unknown Startup'}`);
    console.log(`   Role: ${role}`);
    
    // Send confirmation email to student
    if (req.user.email) {
      await sendApplicationEmail(
        req.user.email,
        req.user.fullName,
        founder.fullName,
        founder.startupName || founder.fullName + "'s Startup",
        role,
        'pending',
        `Thank you for applying to ${founder.startupName}! Your application has been received and is under review.`
      );
    }
    
    // Populate data for response
    await application.populate({
      path: 'studentId',
      select: 'fullName email phone branch year profileImage resume skills bio'
    });
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application: {
        ...application.toObject(),
        applicantName: req.user.fullName,
        email: email || req.user.email
      }
    });
    
  } catch (error) {
    console.error('❌ Error submitting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  }
});

// GET: Get applications for a founder
router.get('/founder/:founderId', protect, async (req, res) => {
  try {
    const { founderId } = req.params;
    
    console.log('📋 Fetching applications for founder:', founderId);
    
    // Verify the requesting user is the founder
    if (founderId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these applications'
      });
    }
    
    const applications = await Application.find({ founderId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'studentId',
        select: 'fullName email phone branch year profileImage resume skills bio enrollmentNumber userType'
      })
      .lean(); // Convert to plain JavaScript objects
    
    // Format applications for frontend
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      studentId: app.studentId?._id || app.studentId,
      founderId: app.founderId,
      role: app.role,
      message: app.message,
      experience: app.experience,
      skills: app.skills || [],
      email: app.email || app.studentId?.email,
      phone: app.phone || app.studentId?.phone,
      resume: app.resume || app.studentId?.resume,
      portfolio: app.portfolio,
      status: app.status,
      previousStatus: app.previousStatus,
      decisionReversed: app.decisionReversed,
      reversedAt: app.reversedAt,
      notes: app.notes,
      responses: app.responses || [],
      notifications: app.notifications || [],
      actionBy: app.actionBy,
      actionDate: app.actionDate,
      applicationDate: app.applicationDate,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      // Additional fields for frontend
      applicantName: app.studentId?.fullName || 'Anonymous',
      applicantType: app.studentId?.userType || 'student',
      studentProfile: app.studentId ? {
        fullName: app.studentId.fullName,
        email: app.studentId.email,
        phone: app.studentId.phone,
        branch: app.studentId.branch,
        year: app.studentId.year,
        profileImage: app.studentId.profileImage,
        resume: app.studentId.resume,
        skills: app.studentId.skills,
        bio: app.studentId.bio,
        enrollmentNumber: app.studentId.enrollmentNumber
      } : null
    }));
    
    res.json({
      success: true,
      applications: formattedApplications
    });
    
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

// GET: Get student's applications
router.get('/student', protect, async (req, res) => {
  try {
    console.log('📋 Fetching applications for student:', req.user._id);
    
    const userType = req.user.userType;
    if (userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view their applications'
      });
    }
    
    const applications = await Application.find({ 
      studentId: req.user._id
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'founderId',
        select: 'fullName startupName profileImage email phone userType'
      });
    
    res.json({
      success: true,
      applications
    });
    
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

// ==================== FIXED ROUTE: Update application status with custom message ====================
// PUT: Update application status with notifications (accepts both customMessage and notificationMessage)
router.put('/:applicationId/status', protect, async (req, res) => {
  try {
    const { applicationId } = req.params;
    // Accept both field names for compatibility
    const { status, notificationMessage, customMessage } = req.body;
    
    // Use customMessage first, then fallback to notificationMessage
    const userMessage = customMessage || notificationMessage;

    console.log('🔄 Updating application status:', {
      applicationId,
      status,
      requestedBy: req.user._id,
      userMessageProvided: !!userMessage
    });
    
    const application = await Application.findById(applicationId)
      .populate('founderId', 'fullName startupName email')
      .populate('studentId', 'fullName email');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Check if current user is the founder
    const founderId = application.founderId._id || application.founderId;
    if (founderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the founder can update application status'
      });
    }
    
    // Store previous status
    const previousStatus = application.status;
    
    // Update application
    application.status = status;
    application.previousStatus = previousStatus;
    application.updatedAt = Date.now();
    application.actionBy = req.user._id;
    application.actionDate = new Date();
    
    await application.save();
    
    // Send email notification with the custom message if provided
    let emailSent = false;
    if (application.studentId && application.studentId.email) {
      // Pass the userMessage (which may be undefined, causing fallback to default)
      emailSent = await sendApplicationEmail(
        application.studentId.email,
        application.studentId.fullName,
        application.founderId.fullName,
        application.founderId.startupName || 'Our Startup',
        application.role,
        status,
        userMessage || `Your application for ${application.role} has been ${status}`
      );
    }
    
    res.json({
      success: true,
      message: `Application ${status} successfully${emailSent ? ' (email sent)' : ' (email notification attempted)'}`,
      application
    });
    
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application'
    });
  }
});

// PUT: Reverse decision (revert to pending)
router.put('/:applicationId/reverse-decision', protect, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { notificationMessage } = req.body;
    
    console.log('↩️ Reversing decision for application:', applicationId);
    
    const application = await Application.findById(applicationId)
      .populate('studentId', 'fullName email')
      .populate('founderId', 'fullName startupName email');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Check if current user is the founder
    if (application.founderId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    const previousStatus = application.status;
    
    // Update application - revert to pending
    application.status = 'pending';
    application.previousStatus = previousStatus;
    application.decisionReversed = true;
    application.reversedAt = new Date();
    application.updatedAt = Date.now();
    
    await application.save();
    
    // Send email notification using the REAL email function
    let emailSent = false;
    if (application.studentId && application.studentId.email) {
      emailSent = await sendApplicationEmail(
        application.studentId.email,
        application.studentId.fullName,
        application.founderId.fullName,
        application.founderId.startupName || 'Our Startup',
        application.role,
        'pending',
        notificationMessage || `Your application status has been reverted to pending for reconsideration.`
      );
    }
    
    res.json({
      success: true,
      message: 'Decision reversed successfully' + (emailSent ? ' (email sent)' : ' (email notification attempted)'),
      application
    });
    
  } catch (error) {
    console.error('Error reversing decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reverse decision'
    });
  }
});

// PUT: Withdraw application (by student)
router.put('/:applicationId/withdraw', protect, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    console.log('🗑️ Withdrawing application:', applicationId);
    
    const application = await Application.findById(applicationId)
      .populate('studentId', 'fullName email')
      .populate('founderId', 'fullName startupName email');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Check if current user is the student who applied
    if (application.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to withdraw this application'
      });
    }
    
    // Update application
    application.previousStatus = application.status;
    application.status = 'withdrawn';
    application.updatedAt = Date.now();
    
    await application.save();
    
    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      application
    });
    
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw application'
    });
  }
});

// GET: Check if user can apply (for frontend validation)
router.get('/can-apply/:founderId/:role', protect, async (req, res) => {
  try {
    const { founderId, role } = req.params;
    
    // Check if user is a founder (prevent founders from applying)
    if (req.user.userType === 'founder') {
      return res.json({
        success: false,
        canApply: false,
        error: 'Founders cannot apply for positions'
      });
    }
    
    // Check if user already applied
    const existingApplication = await Application.findOne({
      studentId: req.user._id,
      founderId,
      role,
      status: { $nin: ['rejected', 'withdrawn'] }
    });
    
    if (existingApplication) {
      return res.json({
        success: false,
        canApply: false,
        error: `You have already applied for the ${role} position at this startup`
      });
    }
    
    res.json({
      success: true,
      canApply: true
    });
    
  } catch (error) {
    console.error('Error checking application eligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check eligibility'
    });
  }
});

// GET: Get application statistics for a founder
router.get('/stats/:founderId', protect, async (req, res) => {
  try {
    const { founderId } = req.params;
    
    // Verify the requesting user is the founder
    if (founderId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    const stats = await Application.aggregate([
      { $match: { founderId: req.user._id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    // Format stats
    const statusCounts = {
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      all: 0
    };
    
    stats.forEach(stat => {
      if (statusCounts.hasOwnProperty(stat._id)) {
        statusCounts[stat._id] = stat.count;
      }
    });
    
    // Calculate total
    statusCounts.all = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    
    res.json({
      success: true,
      stats: statusCounts
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// GET: Check existing application
router.get('/check/:founderId/:role', protect, async (req, res) => {
  try {
    const { founderId, role } = req.params;
    
    const existingApplication = await Application.findOne({
      studentId: req.user._id,
      founderId,
      role
    });
    
    res.json({
      success: true,
      hasApplied: !!existingApplication,
      application: existingApplication
    });
    
  } catch (error) {
    console.error('Error checking application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check application'
    });
  }
});

module.exports = router;