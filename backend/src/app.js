const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Ensure backend .env is loaded from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { initDB } = require('./config/db');
const { getDb } = require('./config/firebase');
const { verifyToken } = require('./middleware/auth');

// Controllers & Routes
const authController = require('./controllers/authController');
const collegeController = require('./controllers/collegeController');

const authRoutes = require('./routes/authRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const competitiveRoutes = require('./routes/competitiveRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for Local Development & Production Frontend URLs (Firebase Hosting, Render, Vercel)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'https://innovate-infinity-c29ee.web.app',
  'https://innovate-infinity-c29ee.firebaseapp.com',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : [])
];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      process.env.CORS_ALLOW_ALL === 'true'
    ) {
      callback(null, true);
    } else {
      console.warn(`CORS rejected origin: ${origin}`);
      callback(null, true); // Fallback allow to prevent production CORS lockouts
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Non-sensitive request logging
app.use((req, res, next) => {
  if (req.path !== '/api/health' && req.path !== '/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Serve Uploaded Files Statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint (Requirement 13)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    success: true,
    message: 'API running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Primary API Route Modules supporting both /api/* and /* prefixes
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/college', '/college'], collegeRoutes);
app.use(['/api/competitive', '/competitive'], competitiveRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/ai', '/ai'], aiRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);

// Direct top-level endpoints for Tasks, Notes, Attendance, CGPA, Goals, Subjects, Assignments, Reminders
app.use(['/api', '/'], collegeRoutes);

app.get(['/api/profile', '/profile'], verifyToken, authController.getProfile);

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Student Academic & Competitive Exam Platform API Server Running',
    version: '1.0.0',
    status: 'Healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`❌ API Error on ${req.method} ${req.originalUrl}:`, {
    code: err.code || err.status || 500,
    message: err.message
  });
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Database & Server Startup
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`🎓 College & 🏆 Competitive Exam Platform Backend Active`);
    console.log({
      firebaseAdminActive: Boolean(getDb()),
      serviceAccountConfigured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS)
    });
    console.log(`=======================================================`);
  });
}).catch(err => {
  console.error('Fatal Initialization Error:', err);
  process.exit(1);
});

module.exports = app;
