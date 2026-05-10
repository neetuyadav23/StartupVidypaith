const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  message: String,
  sentBy: {
    type: String,
    enum: ['student', 'founder']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['application_status', 'message', 'system'],
    default: 'application_status'
  },
  message: String,
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const applicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  experience: String,
  skills: [String],
  email: String,
  phone: String,
  resume: String,
  portfolio: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  previousStatus: String,
  decisionReversed: {
    type: Boolean,
    default: false
  },
  reversedAt: Date,
  notes: String,
  responses: [responseSchema],
  notifications: [notificationSchema],
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actionDate: {
    type: Date
  },
  applicationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

applicationSchema.index({ studentId: 1, founderId: 1 });
applicationSchema.index({ founderId: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);