// models/Founder.js
const mongoose = require('mongoose');

const founderSchema = new mongoose.Schema({
  // Link to users collection
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Info
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  banasthaliId: { type: String, required: true },
  startupName: { type: String, required: true },
  
  // Profile Details
  bio: { type: String },
  profilePhoto: { type: String },
  location: { type: String, default: 'Banasthali Vidyapith' },
  
  // What they're looking for
  lookingFor: [{ type: String }],
  
  // Business Info
  businessStage: { type: String },
  fundingStage: { type: String, default: 'Bootstrapped' },
  
  // Skills & Interests
  skills: [{ type: String }],
  interests: [{ type: String }],
  
  // Contact & Additional Info
  linkedin: { type: String },
  website: { type: String },
  hiring: { type: Boolean, default: false },
  hiringDetails: { type: String },
  
  // Status
  profileComplete: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
founderSchema.index({ userId: 1 }, { unique: true });
founderSchema.index({ banasthaliId: 1 }, { unique: true });
founderSchema.index({ skills: 1 });
founderSchema.index({ lookingFor: 1 });

module.exports = mongoose.model('Founder', founderSchema);