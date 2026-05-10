const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const aiService = require('../services/aiService');

// POST /api/startup/analyze
router.post('/analyze', protect, async (req, res) => {
  try {
    // Only founders can access
    if (req.user.userType !== 'founder') {
      return res.status(403).json({
        success: false,
        error: 'Only founders can request startup analysis'
      });
    }

    const {
      companyName,
      fundingRequired,
      currentMarket,
      netWorth,
      teamSize,
      productCost,
      monthlyRevenue,
      yearsOperating
    } = req.body;

    // Validate required fields
    if (!companyName || !fundingRequired || !currentMarket || !netWorth || !teamSize || !productCost) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const startupData = {
      companyName,
      fundingRequired: Number(fundingRequired),
      currentMarket,
      netWorth: Number(netWorth),
      teamSize: Number(teamSize),
      productCost: Number(productCost),
      monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : 0,
      yearsOperating: yearsOperating ? Number(yearsOperating) : 0
    };

    const analysis = await aiService.analyzeStartup(startupData);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ Error in startup analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
});

module.exports = router;