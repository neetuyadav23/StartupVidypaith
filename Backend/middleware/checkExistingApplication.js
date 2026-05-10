const Application = require('../models/Application');

const checkExistingApplication = async (req, res, next) => {
  try {
    const { founderId, role } = req.body;
    const studentId = req.user._id;

    // Check if user already has an application for this startup and role
    const existingApplication = await Application.findOne({
      studentId,
      founderId,
      role,
      status: { $nin: ['rejected', 'withdrawn'] } // Don't count rejected or withdrawn applications
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: `You have already applied for the ${role} position at this startup`
      });
    }

    next();
  } catch (error) {
    console.error('Error checking existing application:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = checkExistingApplication;