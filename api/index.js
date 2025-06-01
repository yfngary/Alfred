const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

// Optimized MongoDB connection for serverless
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    };

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    console.log('Attempting MongoDB connection...');
    await mongoose.connect(process.env.MONGO_URI, opts);
    isConnected = true;
    console.log('✅ MongoDB Connected successfully');
    
    mongoose.connection.on('disconnected', () => {
      console.log('❌ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    isConnected = false;
    
    // Provide more specific error messages for common issues
    if (error.message.includes('IP whitelist') || error.message.includes('not allowed to access') || error.message.includes('Could not connect to any servers')) {
      const detailedError = new Error(`MongoDB Atlas Connection Failed: ${error.message}. 

Common solutions:
1. Add 0.0.0.0/0 to your MongoDB Atlas IP whitelist for Vercel deployments
2. Check that your cluster is not paused
3. Verify your MONGO_URI connection string is correct
4. Ensure your database user has proper permissions

Current error: ${error.message}`);
      detailedError.originalError = error;
      throw detailedError;
    }
    
    throw error;
  }
}

// User Schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\S*$/, "Username cannot contain spaces"],
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  profilePicture: { type: String },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  groupChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupChat" }],
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// Trip Schema (simplified for now)
const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  type: { 
    type: String, 
    enum: ["activity", "meal", "other"], 
    required: true 
  },
  location: { type: String },
  details: { type: String }
}, { timestamps: true });

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tripName: String,
  destination: String,
  startDate: Date,
  endDate: Date,
  experiences: [experienceSchema],
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { 
      type: String, 
      enum: ["admin", "editor", "viewer"],
      default: "viewer"
    },
    addedAt: { type: Date, default: Date.now }
  }],
  isPublic: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true, sparse: true }
});

// Initialize models (only when DB is connected)
let User, Trip;

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "No token provided" }));
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "No token provided" }));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Failed:", error.message);
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Invalid token" }));
    return;
  }
};

// Main handler
const handler = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }
    
    const url = req.url || '';
    const method = req.method || 'GET';
    const timestamp = new Date().toISOString();
    
    // Health check endpoints (no DB required)
    if (url === '/api/health' || url === '/api/health/') {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        status: 'OK', 
        timestamp,
        environment: process.env.NODE_ENV || 'development',
        message: 'Alfred App API is running'
      }));
      return;
    }
    
    if (url === '/api/test' || url === '/api/test/') {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        message: 'API test endpoint working',
        timestamp,
        mongoUri: process.env.MONGO_URI ? 'configured' : 'not configured',
        jwtSecret: process.env.JWT_SECRET ? 'configured' : 'not configured'
      }));
      return;
    }

    // Main API info (no DB required)
    if (url === '/api' || url === '/api/') {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        message: 'Alfred App API',
        version: '2.0.0',
        timestamp,
        status: 'API is running',
        setup: {
          mongoUri: process.env.MONGO_URI ? 'configured' : 'not configured',
          jwtSecret: process.env.JWT_SECRET ? 'configured' : 'not configured'
        },
        endpoints: {
          auth: {
            'POST /api/auth/register': 'User registration',
            'POST /api/auth/login': 'User login'
          },
          trips: {
            'GET /api/trips/userTrips': 'Get user trips (auth required)',
            'POST /api/trips': 'Create trip (auth required)'
          },
          health: {
            'GET /api/health': 'Health check',
            'GET /api/test': 'Test endpoint'
          }
        },
        note: 'Database connection is established per request for routes that need it'
      }));
      return;
    }

    // Database connection test endpoint
    if (url === '/api/db-test' || url === '/api/db-test/') {
      try {
        await connectToDatabase();
        res.statusCode = 200;
        res.end(JSON.stringify({ 
          message: 'Database connection successful',
          timestamp,
          status: 'connected'
        }));
        return;
      } catch (error) {
        res.statusCode = 503;
        res.end(JSON.stringify({ 
          error: 'Database connection failed',
          message: error.message,
          timestamp,
          note: 'Please check if your IP is whitelisted in MongoDB Atlas'
        }));
        return;
      }
    }

    // For routes that need DB, connect first
    try {
      await connectToDatabase();
      
      // Initialize models after connection
      User = mongoose.models.User || mongoose.model("User", UserSchema);
      Trip = mongoose.models.Trip || mongoose.model("Trip", TripSchema);
      
    } catch (error) {
      res.statusCode = 503;
      res.end(JSON.stringify({ 
        error: 'Database connection failed',
        message: 'Cannot process request without database connection',
        details: error.message,
        timestamp,
        note: 'Please check if your IP is whitelisted in MongoDB Atlas'
      }));
      return;
    }
    
    // Parse request body for POST/PUT requests
    let body = {};
    if (method === 'POST' || method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        body = {};
      }
    }

    // AUTH ROUTES
    if (url === '/api/auth/register' && method === 'POST') {
      try {
        const { username, name, email, password, phone } = body;
        
        if (!username || !name || !email || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing required fields" }));
          return;
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Email already in use" }));
          return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiration = new Date();
        tokenExpiration.setHours(tokenExpiration.getHours() + 24);

        // Save new user
        const newUser = new User({
          username,
          name,
          email,
          password: hashedPassword,
          phone,
          isEmailVerified: true, // Simplified for now
          emailVerificationToken: verificationToken,
          emailVerificationExpires: tokenExpiration
        });

        await newUser.save();
        
        res.statusCode = 201;
        res.end(JSON.stringify({ 
          message: "User registered successfully",
          user: { id: newUser._id, name: newUser.name, email: newUser.email }
        }));
        return;
      } catch (error) {
        console.error("Registration error:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Server error during registration" }));
        return;
      }
    }

    if (url === '/api/auth/login' && method === 'POST') {
      try {
        const { email, password } = body;

        if (!email || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Email and password required" }));
          return;
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid credentials" }));
          return;
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid credentials" }));
          return;
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user._id, email: user.email }, 
          process.env.JWT_SECRET, 
          { expiresIn: "24h" }
        );

        res.statusCode = 200;
        res.end(JSON.stringify({ 
          message: "Login successful", 
          token, 
          user: { name: user.name, email: user.email, id: user._id }
        }));
        return;
      } catch (error) {
        console.error("Login Error:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Server error during login" }));
        return;
      }
    }

    // PROTECTED ROUTES (require authentication)
    // Simple auth check for protected routes
    const authResult = await new Promise((resolve) => {
      authMiddleware(req, res, () => resolve(true));
    }).catch(() => false);

    if (!authResult && url.startsWith('/api/trips')) {
      return; // Auth middleware already sent the response
    }

    // TRIP ROUTES
    if (url === '/api/trips/userTrips' && method === 'GET' && authResult) {
      try {
        const userId = req.user.id;
        
        const trips = await Trip.find({
          $or: [
            { userId: userId },
            { 'collaborators.user': userId },
            { isPublic: true }
          ]
        });

        res.statusCode = 200;
        res.end(JSON.stringify({ trips }));
        return;
      } catch (error) {
        console.error("Error fetching trips:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Server error fetching trips" }));
        return;
      }
    }

    if (url === '/api/trips' && method === 'POST' && authResult) {
      try {
        const { tripName, destination, startDate, endDate } = body;
        
        if (!tripName || !destination) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Trip name and destination required" }));
          return;
        }

        const newTrip = new Trip({
          userId: req.user.id,
          tripName,
          destination,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          experiences: [],
          collaborators: [],
          isPublic: false
        });

        await newTrip.save();
        
        res.statusCode = 201;
        res.end(JSON.stringify({ 
          message: "Trip created successfully",
          trip: newTrip
        }));
        return;
      } catch (error) {
        console.error("Error creating trip:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Server error creating trip" }));
        return;
      }
    }
    
    // 404 for unknown routes
    res.statusCode = 404;
    res.end(JSON.stringify({
      error: 'Not found',
      message: `Route ${method} ${url} not found`,
      timestamp
    }));
    
  } catch (error) {
    console.error('Handler error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  }
};

module.exports = handler; 