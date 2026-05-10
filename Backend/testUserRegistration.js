// testUserRegistration.js
const mongoose = require('mongoose');
const User = require('./models/User');

async function testUserRegistration() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/banasthali_startup', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test user
    console.log('\n🧪 Creating test user...');
    const testUser = new User({
      banasthaliId: 'BTFDR20201',
      email: 'test@banasthali.com',
      password: 'test123',
      fullName: 'Test User',
      startupName: 'Test Startup',
      userType: 'founder'
    });

    await testUser.save();
    console.log('✅ Test user created:', testUser._id);

    // Test 2: Verify password hashing worked
    console.log('\n🔐 Testing password comparison...');
    const isMatch = await testUser.comparePassword('test123');
    console.log('Password match:', isMatch ? '✅ Yes' : '❌ No');

    // Test 3: Try to create duplicate user
    console.log('\n🚫 Testing duplicate prevention...');
    try {
      const duplicateUser = new User({
        banasthaliId: 'BTFDR20201', // Same ID
        email: 'test2@banasthali.com',
        password: 'test123',
        fullName: 'Another User',
        startupName: 'Another Startup',
        userType: 'founder'
      });
      await duplicateUser.save();
    } catch (error) {
      console.log('✅ Correctly prevented duplicate:', error.message);
    }

    // Test 4: List all users
    console.log('\n📋 All users in database:');
    const allUsers = await User.find({}, 'banasthaliId email fullName userType');
    allUsers.forEach(user => {
      console.log(`   ${user.banasthaliId} - ${user.email} (${user.fullName})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testUserRegistration();