// models/User.js - SIMPLIFIED VERSION (WITH RESET TOKEN FIELDS)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  banasthaliId: {
    type: String,
    required: [true, 'Please add a Banasthali ID'],
    unique: true,
    uppercase: true,
    match: [/^BT[A-Z]{3}\d{5}$/, 'Please use valid Banasthali ID format: BT + 3 letters + 5 numbers']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  userType: {
    type: String,
    enum: ['student', 'founder', 'admin'],
    default: 'student'
  },
  branch: {
    type: String,
    required: function() {
      return this.userType === 'student';
    }
  },
  year: {
    type: String,
    required: function() {
      return this.userType === 'student';
    }
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, 'Please add a valid 10-digit phone number']
  },
  startupName: {
    type: String,
    required: function() {
      return this.userType === 'founder';
    }
  },
  designation: {
    type: String,
    required: function() {
      return this.userType === 'admin';
    }
  },
  profileImage: String,
  resume: String,
  bio: String,
  skills: [String],
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // ========== NEW FIELDS FOR PASSWORD RESET ==========
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// ✅ UPDATED: Remove `next` parameter - use async/await only
UserSchema.pre('save', async function() {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    console.log('🔑 Password not modified, skipping hash');
    return;
  }
  
  console.log('🔑 Hashing password for user:', this.banasthaliId);
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Replace the password with the hashed one
    this.password = hashedPassword;
    
    console.log('✅ Password hashed successfully');
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    throw error; // Let Mongoose handle the error
  }
});

// Method to compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Get user profile without sensitive data
UserSchema.methods.getProfile = function() {
  return {
    _id: this._id,
    fullName: this.fullName,
    banasthaliId: this.banasthaliId,
    email: this.email,
    userType: this.userType,
    branch: this.branch,
    year: this.year,
    phone: this.phone,
    startupName: this.startupName,
    designation: this.designation,
    profileImage: this.profileImage,
    resume: this.resume,
    bio: this.bio,
    skills: this.skills,
    isProfileComplete: this.isProfileComplete,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', UserSchema);