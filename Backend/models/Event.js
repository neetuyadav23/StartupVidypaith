const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: '' // Optional
  },
  category: {
    type: String,
    enum: ['Hiring', 'Hackathon', 'Workshop', 'Competition', 'Networking', 'Conference', 'Webinar', 'Other'],
    default: 'Other'
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    default: '10:00 AM'
  },
  location: {
    type: String,
    default: 'Online'
  },
  applyLink: {
    type: String,
    default: '' // Optional
  },
  startupName: {
    type: String,
    required: [true, 'Startup name is required']
  },
  startupLogo: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: {
    type: String,
    required: true
  },
  creatorRole: {
    type: String,
    enum: ['admin', 'founder', 'student'],
    required: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  registrationDeadline: {
    type: Date
  },
  maxParticipants: {
    type: Number
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// FIXED: Pre-save hook - Remove the problematic middleware
// Don't use the pre-save hook with next() callback

// Add pagination plugin
eventSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Event', eventSchema);