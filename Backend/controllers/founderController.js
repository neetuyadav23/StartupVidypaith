// controllers/founderController.js - ADD EXPORTS
const Founder = require('../models/Founder');
const Product = require('../models/Product');
const User = require('../models/User');

// Auto-create sample product for new founders
const createSampleProduct = async (founderId) => {
  try {
    const sampleProduct = await Product.create({
      founderId: founderId,
      name: "Our First Product",
      description: "This is our initial product. We'll add more details soon!",
      category: "Software",
      status: "Idea",
      tags: ["New", "In Development"],
      featured: true
    });
    console.log('✅ Auto-created sample product:', sampleProduct._id);
    return sampleProduct;
  } catch (error) {
    console.error('❌ Error creating sample product:', error);
    return null;
  }
};

// Get founder by user ID
const getFounderByUserId = async (userId) => {
  try {
    return await Founder.findOne({ userId });
  } catch (error) {
    throw error;
  }
};

// Get founder by ID with populated data
const getFounderById = async (founderId) => {
  try {
    return await Founder.findById(founderId)
      .populate('userId', 'fullName email banasthaliId userType');
  } catch (error) {
    throw error;
  }
};

// Get all founders (for directory)
const getAllFounders = async () => {
  try {
    return await Founder.find({})
      .populate('userId', 'fullName email banasthaliId userType')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createSampleProduct,
  getFounderByUserId,
  getFounderById,
  getAllFounders
};