// models/Question.js - UPDATED with founderDocumentId
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Who is asking (user or founder)
  askedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Which founder's profile is this question on (User ID reference)
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // NEW: Founder document ID reference
  founderDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Founder',
    required: true
  },
  // Question content
  question: {
    type: String,
    required: true,
    trim: true
  },
  // Answer from founder
  answer: {
    type: String,
    default: ''
  },
  // Category for filtering
  category: {
    type: String,
    enum: ['General', 'Business', 'Technology', 'Funding', 'Marketing', 'Career', 'Application'],
    default: 'General'
  },
  // Anonymous posting
  anonymous: {
    type: Boolean,
    default: false
  },
  // For applications - track status
  applicationStatus: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected', ''],
    default: ''
  },
  // Additional application data
  applicationData: {
    role: String,
    experience: String,
    skills: [String],
    email: String,
    resume: String
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  answeredAt: Date,
  isAnswered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);