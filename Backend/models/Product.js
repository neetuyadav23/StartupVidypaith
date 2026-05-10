// models/Product.js - Update to:
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Founder',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  image: {
    type: String, // Base64 or URL
    default: ''
  },
  category: {
    type: String,
    enum: ['Software', 'Hardware', 'Service', 'App', 'Website', 'Other'],
    default: 'Software'
  },
  status: {
    type: String,
    enum: ['Idea', 'Prototype', 'Beta', 'Launched', 'Scaling'],
    default: 'Idea'
  },
  url: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);