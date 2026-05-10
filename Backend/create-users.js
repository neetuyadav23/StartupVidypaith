// backend/test-create.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Drop the existing users collection and recreate it
    console.log('\n🧹 Resetting users collection...');
    await mongoose.connection.dropCollection('users').catch(() => {
      console.log('Collection did not exist, creating new...');
    });
    
    // Create a simple schema without middleware for testing
    const userSchema = new mongoose.Schema({
      fullName: String,
      banasthaliId: { type: String, unique: true, uppercase: true },
      password: String,
      userType: String,
      branch: String,
      year: String,
      phone: String,
      isVerified: Boolean,
      createdAt: { type: Date, default: Date.now }
    });
    
    const User = mongoose.model('User', userSchema);
    
    console.log('\n👥 Creating test users with pre-hashed passwords...');
    
    const testUsers = [
      {
        fullName: 'Admin User',
        banasthaliId: 'ABCDE12345',
        password: await bcrypt.hash('Admin@123', 10), // Pre-hashed
        userType: 'admin',
        branch: 'Administration',
        year: 'Alumni',
        phone: '9876543210',
        isVerified: true
      },
      {
        fullName: 'Founder User',
        banasthaliId: 'FGHIJ67890',
        password: await bcrypt.hash('Founder@123', 10), // Pre-hashed
        userType: 'founder',
        branch: 'Computer Science',
        year: 'Alumni',
        phone: '9876543211',
        isVerified: true
      },
      {
        fullName: 'Student User',
        banasthaliId: 'KLMNO13579',
        password: await bcrypt.hash('Student@123', 10), // Pre-hashed
        userType: 'student',
        branch: 'Computer Science',
        year: '3rd',
        phone: '9876543212',
        isVerified: true
      }
    ];

    const createdUsers = [];
    
    for (const userData of testUsers) {
      try {
        console.log(`Creating: ${userData.banasthaliId}...`);
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`✅ Created: ${user.banasthaliId}`);
      } catch (saveError) {
        console.error(`❌ Failed: ${userData.banasthaliId}`, saveError.message);
      }
    }
    
    console.log('\n📋 Login Credentials:');
    console.log('1. Admin:    ABCDE12345 / Admin@123');
    console.log('2. Founder:  FGHIJ67890 / Founder@123');
    console.log('3. Student:  KLMNO13579 / Student@123');
    
    const count = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${count}`);
    
    await mongoose.connection.close();
    console.log('\n🎉 Done! Test users created.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUsers();