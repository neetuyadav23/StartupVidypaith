// backend/health-check.js
const fetch = require('node-fetch');

async function checkHealth() {
  console.log('🏥 Checking system health...\n');
  
  // Check 1: Server is running
  console.log('1. Checking backend server...');
  try {
    const healthRes = await fetch('http://localhost:5000/health');
    const healthData = await healthRes.json();
    console.log(`   ✅ Backend: ${healthData.message}`);
  } catch (error) {
    console.log(`   ❌ Backend not running: ${error.message}`);
    console.log('   💡 Start backend: node server.js');
  }
  
  // Check 2: Auth API
  console.log('\n2. Checking auth API...');
  try {
    const authRes = await fetch('http://localhost:5000/api/auth/test');
    const authData = await authRes.json();
    console.log(`   ✅ Auth API: ${authData.message}`);
  } catch (error) {
    console.log(`   ❌ Auth API error: ${error.message}`);
  }
  
  // Check 3: Founders API
  console.log('\n3. Checking founders API...');
  try {
    const foundersRes = await fetch('http://localhost:5000/api/founders');
    const foundersData = await foundersRes.json();
    console.log(`   ✅ Founders API: ${foundersData.count || 0} founders found`);
  } catch (error) {
    console.log(`   ❌ Founders API error: ${error.message}`);
  }
  
  console.log('\n📊 Summary:');
  console.log('   • Backend should be running on http://localhost:5000');
  console.log('   • Frontend should be running on http://localhost:3000');
  console.log('   • MongoDB should be connected via Atlas');
}

checkHealth();