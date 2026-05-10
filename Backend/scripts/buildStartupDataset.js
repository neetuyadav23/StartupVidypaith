// buildStartupDataset.js
const path = require('path');
const fs = require('fs');

// Load .env from the Backend folder (one level up from scripts)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

console.log('🚀 Script started');
console.log('📁 Current directory:', __dirname);
console.log('🔍 Loading .env from:', path.join(__dirname, '../.env'));

// Check if MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}
console.log('✅ MONGODB_URI loaded (hidden)');

let Founder, Product;
try {
  Founder = require('../models/Founder');
  Product = require('../models/Product');
  console.log('✅ Models loaded from ../models');
} catch (err) {
  console.log('⚠️ Could not load models:', err.message);
}

async function buildStartupDataset() {
  try {
    console.log(`🔌 Connecting to MongoDB Atlas...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected');

    // Try to get founders using model or direct collection
    let founders = [];
    if (Founder) {
      founders = await Founder.find({ profileComplete: true }).lean();
      console.log(`📊 Using Founder model: ${founders.length} founders found`);
    } else {
      const db = mongoose.connection.db;
      const collection = db.collection('founders');
      founders = await collection.find({ profileComplete: true }).toArray();
      console.log(`📊 Using native driver: ${founders.length} founders found`);
    }

    // If still no founders, show all founders (maybe profileComplete is false or missing)
    if (founders.length === 0) {
      console.log('⚠️ No founders with profileComplete=true, fetching all founders...');
      const db = mongoose.connection.db;
      const all = await db.collection('founders').find({}).toArray();
      console.log(`📊 Total founders in DB: ${all.length}`);
      if (all.length > 0) {
        founders = all; // use all for now
        console.log('✅ Using all founders for dataset (profileComplete not required)');
      } else {
        console.log('❌ No founders at all in database');
        founders = [];
      }
    }

    if (founders.length === 0) {
      console.log('⚠️ No founders found. Using mock data for testing.');
      founders = [
        { _id: new mongoose.Types.ObjectId(), startupName: 'Mock AI', bio: 'Test AI startup', interests: ['AI'], lookingFor: ['Co-founder'], hiring: true }
      ];
    }

    const startups = founders.map(f => ({
      id: f._id.toString(),
      name: f.startupName || 'Unnamed',
      description: f.bio || '',
      industry: (f.interests || []).slice(0,3).join(', '),
      hiring: f.hiring || false,
      looking_for: (f.lookingFor || []).slice(0,2).join(', '),
      text: [f.bio, ...(f.interests||[]), ...(f.lookingFor||[])].filter(Boolean).join(' ').toLowerCase()
    }));

    const outPath = path.join(process.cwd(), 'startups.json');
    fs.writeFileSync(outPath, JSON.stringify(startups, null, 2));
    console.log(`✅ Saved ${startups.length} startups to ${outPath}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

buildStartupDataset();