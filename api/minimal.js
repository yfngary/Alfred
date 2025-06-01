// Minimal API test without any external dependencies

module.exports = (req, res) => {
  // Simple health check
  if (req.url === '/api/minimal' || req.url === '/api/minimal/') {
    res.status(200).json({
      status: 'OK',
      message: 'Minimal API working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
    return;
  }
  
  // Default response
  res.status(404).json({
    error: 'Not found',
    availableEndpoints: ['/api/minimal']
  });
}; 