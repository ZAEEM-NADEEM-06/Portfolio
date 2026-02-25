const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Get secret admin path from env
const adminPath = process.env.ADMIN_SECRET_PATH || 'maheen-dashboard-2025';

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://textile-designer.vercel.app',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    console.log('📦 Database:', mongoose.connection.name);
    
    try {
      const result = await mongoose.connection.db.collection('users').updateMany(
        {}, 
        { $inc: { tokenVersion: 1 } }
      );
      console.log(`🔄 Server restart: Auto-logout triggered for ${result.modifiedCount} users`);
      
      if (mongoose.connection.db.collection('sessions')) {
        await mongoose.connection.db.collection('sessions').updateMany(
          {},
          { $set: { isActive: false } }
        );
        console.log('🔄 All sessions deactivated');
      }
    } catch (err) {
      console.log('⚠️ No users found to logout (first run or empty database)');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Routes - IMPORTANT: Make sure this is correct
console.log(`🔐 Admin routes mounted at: /api/${adminPath}`);
app.use(`/api/${adminPath}`, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', messageRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Maheen Nadeem Textile Portfolio API',
    adminPath: `/${adminPath}`,
    serverTime: new Date().toISOString(),
    endpoints: {
      auth: {
        login: `POST /api/${adminPath}/login`,
        logout: `POST /api/${adminPath}/logout`,
        verify: `GET /api/${adminPath}/verify`,
        changePassword: `PUT /api/${adminPath}/change-password`
      },
      projects: {
        getAll: 'GET /api/projects',
        getOne: 'GET /api/projects/:id',
        create: 'POST /api/projects',
        update: 'PUT /api/projects/:id',
        delete: 'DELETE /api/projects/:id',
        reorder: 'PUT /api/projects/order'
      }
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Export for Vercel
module.exports = app;

// Only listen if not in serverless environment
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Admin login URL: http://localhost:${PORT}/api/${adminPath}/login`);
  });
}