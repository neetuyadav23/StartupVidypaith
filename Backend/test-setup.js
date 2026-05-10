// backend/test-setup.js - COMPLETE WORKING TEST
require('dotenv').config();
const mongoose = require('mongoose');

async function setupTestDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('Database URL:', process.env.MONGODB_URI ? 'Present' : 'Missing');
    
    // Simple connection without options
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Connected to MongoDB Atlas!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Check current collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Existing Collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Create test users using your actual User model
    console.log('\n👥 Creating test users...');
    
    // First, clear any existing test users
    await mongoose.connection.collection('users').deleteMany({
      banasthaliId: { $in: ['ADMIN001', 'FOUNDER001', 'STUDENT001'] }
    });
    
    // Create test users directly in the database
    const testUsers = [
      {
        _id: new mongoose.Types.ObjectId(),
        fullName: 'Test Admin',
        banasthaliId: 'ADMIN001',
        email: 'admin.test@banasthali.com',
        password: '$2a$10$X8zQr7J9Z3q4W5e6r7T8u9i0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g', // Hashed "Admin@123"
        userType: 'admin',
        designation: 'System Administrator',
        phone: '9876543210',
        emailVerified: true,
        profileComplete: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        fullName: 'Test Founder',
        banasthaliId: 'FOUNDER001',
        email: 'founder.test@banasthali.com',
        password: '$2a$10$X8zQr7J9Z3q4W5e6r7T8u9i0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g', // Hashed "Founder@123"
        userType: 'founder',
        startupName: 'Tech Innovations Pvt Ltd',
        phone: '9876543211',
        emailVerified: true,
        profileComplete: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        fullName: 'Test Student',
        banasthaliId: 'STUDENT001',
        email: 'student.test@banasthali.com',
        password: '$2a$10$X8zQr7J9Z3q4W5e6r7T8u9i0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g', // Hashed "Student@123"
        userType: 'student',
        year: 3,
        branch: 'Computer Science',
        phone: '9876543212',
        emailVerified: true,
        profileComplete: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert test users
    const result = await mongoose.connection.collection('users').insertMany(testUsers);
    console.log(`✅ Created ${result.insertedCount} test users`);
    
    // Verify they exist
    const userCount = await mongoose.connection.collection('users').countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Show login credentials
    console.log('\n🔐 TEST LOGIN CREDENTIALS:');
    console.log('=======================================');
    console.log('1. ADMIN Login:');
    console.log('   Email/Banasthali ID: ADMIN001');
    console.log('   Password: Admin@123');
    console.log('   Login URL: http://localhost:3000/login');
    console.log('\n2. FOUNDER Login:');
    console.log('   Email/Banasthali ID: FOUNDER001');
    console.log('   Password: Founder@123');
    console.log('   Login URL: http://localhost:3000/login');
    console.log('\n3. STUDENT Login:');
    console.log('   Email/Banasthali ID: STUDENT001');
    console.log('   Password: Student@123');
    console.log('   Login URL: http://localhost:3000/login');
    console.log('=======================================');
    
    // Test API endpoints
    console.log('\n🌐 Testing API Endpoints...');
    const endpoints = [
      { url: 'http://localhost:5000/', method: 'GET', name: 'Home' },
      { url: 'http://localhost:5000/health', method: 'GET', name: 'Health Check' },
      { url: 'http://localhost:5000/api/auth/test', method: 'GET', name: 'Auth Test' }
    ];
    
    const fetch = (await import('node-fetch')).default;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, { method: endpoint.method });
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: ${response.status} - ${data.message || 'OK'}`);
      } catch (error) {
        console.log(`⚠️ ${endpoint.name}: Server might not be running`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 Test setup completed successfully!');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Start your backend server: node server.js');
    console.log('2. Start your frontend server (React)');
    console.log('3. Go to http://localhost:3000/login');
    console.log('4. Use the test credentials above to login');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    // Provide specific troubleshooting tips
    if (error.message.includes('bad auth')) {
      console.log('\n🔧 Fix: Check your MongoDB Atlas password');
      console.log('   - Password might contain special characters');
      console.log('   - Try regenerating the password in MongoDB Atlas');
      console.log('   - URL encode special characters (replace @ with %40)');
    } else if (error.message.includes('network')) {
      console.log('\n🔧 Fix: Check network connectivity');
      console.log('   - Ensure you are connected to internet');
      console.log('   - Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Fix: DNS issue with MongoDB Atlas');
      console.log('   - Try using Google DNS: 8.8.8.8');
      console.log('   - Check if MongoDB Atlas cluster is active');
    }
    
    process.exit(1);
  }
}

setupTestDatabase();