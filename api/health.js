/**
 * Simple health check endpoint for Vercel
 */

module.exports = async (req, res) => {
  console.log('Health check called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    res.status(200).json({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'Not set',
        VERCEL: process.env.VERCEL || 'Not set'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
