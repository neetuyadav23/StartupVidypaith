// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Founder = require('../models/Founder');
const { protect } = require('../middleware/authMiddleware');

// Create a product
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, category, status, url, tags,image } = req.body;
    
    // Get founder ID from user
    const founder = await Founder.findOne({ userId: req.user.id });
    
    if (!founder) {
      return res.status(404).json({
        success: false,
        message: 'Founder profile not found'
      });
    }
    
    const product = await Product.create({
      founderId: founder._id,
      name,
      description,
      category,
      status,
      url,
      tags,
      image: image || ''  // Add image field
    });
    
    res.status(201).json({
      success: true,
      product
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get founder's products
router.get('/founder/:founderId', async (req, res) => {
  try {
    const products = await Product.find({ 
      founderId: req.params.founderId 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      products
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update product
router.put('/:id', protect, async (req, res) => {
  try {
    // Verify product belongs to founder
    const founder = await Founder.findOne({ userId: req.user.id });
    if (!founder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found'
      });
    }
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, founderId: founder._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete product
router.delete('/:id', protect, async (req, res) => {
  try {
    const founder = await Founder.findOne({ userId: req.user.id });
    if (!founder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found'
      });
    }
    
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      founderId: founder._id
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all products (for directory)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('founderId', 'fullName startupName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      products
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;