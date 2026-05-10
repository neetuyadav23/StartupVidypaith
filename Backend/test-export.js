// test-export.js
const authController = require('./controllers/authController');
console.log('Auth Controller exports:', Object.keys(authController));

const authRoutes = require('./routes/authRoutes');
console.log('Auth Routes loaded');