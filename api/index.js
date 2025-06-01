const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const serverless = require('serverless-http');

// Import routes using absolute paths from the project root
const authRoutes = require('../alfred-app-backend/routes/authRoutes');
const tripRoutes = require('../alfred-app-backend/routes/tripRoutes');
const chatRoutes = require('../alfred-app-backend/routes/chatRoutes');
const userRoutes = require('../alfred-app-backend/routes/userRoutes');
const requestRoutes = require('../alfred-app-backend/routes/requestRoutes');

require('dotenv').config();

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://alfred-app.vercel.app',
    'https://alfred-app-two.vercel.app',
    'https://alfred-4lgw4t3rp-yfngarys-projects.vercel.app',
    'https://alfred-lot233sjz-yfngarys-projects.vercel.app',
    'https://alfred-od7nla94a-yfngarys-projects.vercel.app',
    'https://alfred-e5chu3s6a-yfngarys-projects.vercel.app',
    'https://alfred-e6gh7k1o4-yfngarys-projects.vercel.app',
    /^https:\/\/alfred-.*\.vercel\.app$/,
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Optimized MongoDB connection for serverless
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose.connection;
  }

  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 5, // Reduced for serverless
      serverSelectionTimeoutMS: 3000, // Reduced timeout
      socketTimeoutMS: 20000, // Reduced timeout
      family: 4,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    };

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    const connection = await mongoose.connect(process.env.MONGO_URI, opts);
    isConnected = true;
    console.log('✅ MongoDB Connected successfully');
    
    // Handle disconnection events
    mongoose.connection.on('disconnected', () => {
      console.log('❌ MongoDB disconnected');
      isConnected = false;
    });

    return connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    isConnected = false;
    throw error;
  }
}

// Health endpoint for checking server status (before DB middleware)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'API is running - no database connection required for this endpoint'
  });
});

// Simple test endpoint that requires no external dependencies
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    mongoStatus: isConnected ? 'connected' : 'disconnected'
  });
});

// Database connection middleware with improved timeout handling
app.use(async (req, res, next) => {
  // Skip database connection for health and test endpoints
  if (req.path === '/api/health' || req.path === '/api/test' || req.path === '/api') {
    return next();
  }
  
  try {
    const timeoutMs = 5000; // 5 second timeout for DB connection
    const connectionPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs);
    });

    await Promise.race([connectionPromise, timeoutPromise]);
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    
    // Return appropriate error response
    const errorResponse = {
      error: 'Database connection failed',
      message: 'Please try again in a moment',
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = err.message;
    }
    
    res.status(503).json(errorResponse);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);

// Static files - Updated path
app.use('/uploads', express.static(path.join(__dirname, '../alfred-app-backend/uploads')));

// Root endpoint for testing
app.get('/api', (req, res) => {
  res.status(200).json({ 
    message: 'Alfred App API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongoStatus: isConnected ? 'connected' : 'disconnected'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Export the handler for Vercel
module.exports = serverless(app); 