const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./database/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const founderRoutes = require('./routes/founders');
const productRoutes = require('./routes/products');
const questionRoutes = require('./routes/questions');
const applicationRoutes = require('./routes/applications');
const studentRoutes = require('./routes/students');
const blogRoutes = require('./routes/blogRoutes');
const eventRoutes = require('./routes/eventRoutes');
const exploreRoutes = require('./routes/explore');   // <-- Now using explore.js

dotenv.config();
connectDB();

// ✅ Fixed syntax errors below (added =>)
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS setup – allows any origin (good for development)
app.use(cors({
  origin: true,
  credentials: true
}));

// Static files
const uploadsPath = path.join(__dirname, 'uploads');
console.log('📁 Static files path:', uploadsPath);
app.use('/uploads', (req, res, next) => {
  console.log(`📁 Static file requested: ${req.originalUrl}`);
  next();
});      
app.use('/uploads', express.static(uploadsPath));

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/founders', founderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);

app.use('/api/community', require('./routes/community'));
app.use('/api/message', require('./routes/message'));

// Mount explore routes on /api/startup (matches frontend)
app.use('/api/startup', exploreRoutes);

// Test upload endpoint
app.get('/test-upload', (req, res) => {
  const fs = require('fs');
  try {
    const uploadsExists = fs.existsSync(uploadsPath);
    const profilesExists = fs.existsSync(path.join(uploadsPath, 'profiles'));
    const resumesExists = fs.existsSync(path.join(uploadsPath, 'resumes'));
    res.json({
      success: true,
      message: 'Upload directory test',
      directories: { uploads: uploadsExists, profiles: profilesExists, resumes: resumesExists },
      currentDirectory: __dirname,
      uploadsPath
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Banasthali Startup Portal API',
    version: '1.0.0',
    status: 'Server is running',
    endpoints: {
      testUpload: '/test-upload',
      health: '/health',
      staticFiles: '/uploads/:filename'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  console.error('Error stack:', err.stack);
  if (err.message && err.message.includes('next is not a function')) {
    return res.status(500).json({ success: false, error: 'Server middleware configuration error' });
  }
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
// 🔥 BIND TO ALL NETWORK INTERFACES so other devices can access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (accessible from network)`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌍 Test static files at: http://localhost:${PORT}/test-upload`);
});