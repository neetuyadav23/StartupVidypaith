// createDemoUsers.js - SIMPLE VERSION THAT WILL WORK
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// DEMO USERS
const demoUsers = [
  {
    fullName: 'Priya Sharma',
    userType: 'student',
    email: 'priya.sharma@gmail.com',
    banasthaliId: 'BTCSE20201',
    password: 'Student@123',
    phone: '9876543210',
    branch: 'Computer Science',
    year: '3rd',
    isVerified: true,
    isActive: true
  },
  {
    fullName: 'Meera Joshi',
    userType: 'founder',
    email: 'meera.joshi@techstartup.com',
    banasthaliId: 'BTFDR20201',
    password: 'Founder@123',
    phone: '9876543220',
    startupName: 'EcoTech Solutions',
    isVerified: true,
    isActive: true
  },
  {
    fullName: 'Dr. Sunita Verma',
    userType: 'admin',
    email: 'sunita.verma@banasthali.in',
    banasthaliId: 'BTADM20201',
    password: 'Admin@123',
    phone: '9876543230',
    designation: 'Faculty Coordinator',
    isVerified: true,
    isActive: true
  }
];

const createDemoUsers = async () => {
  console.log('🚀 Creating demo users...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banasthali_startup');
    console.log('✅ Connected to MongoDB\n');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // Check if users collection exists
    const collections = await db.listCollections().toArray();
    const usersCollectionExists = collections.some(col => col.name === 'users');
    
    if (!usersCollectionExists) {
      console.log('📁 Creating users collection...');
    }
    
    // Get users collection
    const usersCollection = db.collection('users');
    
    let createdCount = 0;
    
    for (const userData of demoUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user document
      const userDoc = {
        ...userData,
        password: hashedPassword,
        email: userData.email.toLowerCase(),
        banasthaliId: userData.banasthaliId.toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Check if user exists
      const existingUser = await usersCollection.findOne({
        $or: [
          { email: userDoc.email },
          { banasthaliId: userDoc.banasthaliId }
        ]
      });
      
      if (existingUser) {
        console.log(`⏭️  ${userData.fullName} already exists`);
        continue;
      }
      
      // Insert user
      await usersCollection.insertOne(userDoc);
      createdCount++;
      
      console.log(`✅ Created: ${userData.fullName} (${userData.userType})`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Banasthali ID: ${userData.banasthaliId}`);
      console.log(`   Password: ${userData.password}\n`);
    }
    
    // Show summary
    const totalUsers = await usersCollection.countDocuments();
    console.log('📊 SUMMARY:');
    console.log(`✅ Created: ${createdCount} new users`);
    console.log(`📁 Total users in database: ${totalUsers}\n`);
    
    if (createdCount > 0) {
      console.log('🔐 LOGIN CREDENTIALS:');
      console.log('=====================');
      demoUsers.forEach(user => {
        const emoji = user.userType === 'student' ? '🎓' : 
                      user.userType === 'founder' ? '💼' : '👩‍🏫';
        console.log(`\n${emoji} ${user.fullName}`);
        console.log(`   Login with: ${user.banasthaliId} OR ${user.email}`);
        console.log(`   Password: ${user.password}`);
      });
    }
    
    console.log('\n🎉 Demo users created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from MongoDB');
  }
};

// Run the script
createDemoUsers();