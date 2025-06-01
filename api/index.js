const serverless = require('serverless-http');

// Simple handler without Express
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
    const timestamp = new Date().toISOString();
    
    // Simple routing
    if (url === '/api/health' || url === '/api/health/') {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        status: 'OK', 
        timestamp,
        environment: process.env.NODE_ENV || 'development',
        message: 'API is running - simplified version'
      }));
      return;
    }
    
    if (url === '/api/test' || url === '/api/test/') {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        message: 'Simple test endpoint working',
        timestamp,
        mongoUri: process.env.MONGO_URI ? 'configured' : 'not configured'
      }));
      return;
    }
    
    if (url === '/api' || url === '/api/') {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        message: 'Alfred App API is running',
        version: '1.0.0',
        timestamp,
        endpoints: [
          '/api/health - Health check',
          '/api/test - Simple test'
        ]
      }));
      return;
    }
    
    // Handle route placeholders
    if (url.startsWith('/api/auth')) {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        message: 'Auth routes placeholder - working',
        timestamp
      }));
      return;
    }
    
    if (url.startsWith('/api/trips')) {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        message: 'Trips routes placeholder - working',
        timestamp
      }));
      return;
    }
    
    // 404 for unknown routes
    res.statusCode = 404;
    res.end(JSON.stringify({
      error: 'Not found',
      message: `Route ${url} not found`,
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