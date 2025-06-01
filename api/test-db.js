const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

async function testConnection() {
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

    console.log('Attempting to connect to MongoDB...');
    console.log('MONGO_URI configured:', !!process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, opts);
    console.log('✅ MongoDB Connection successful!');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected successfully');
    
    return {
      success: true,
      message: 'Database connection successful',
      collections: collections.map(c => c.name)
    };
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    return {
      success: false,
      error: error.message,
      type: error.name
    };
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  const result = await testConnection();
  
  res.statusCode = result.success ? 200 : 503;
  res.end(JSON.stringify({
    ...result,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  }));
}; 