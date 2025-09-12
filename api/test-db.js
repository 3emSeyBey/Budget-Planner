/**
 * Vercel serverless function for testing database connection
 */

const { getConnection } = require('../lib/database');

module.exports = async (req, res) => {
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
    if (req.method === 'GET') {
      // Check environment variables
      const envCheck = {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV || 'Not set',
        VERCEL: process.env.VERCEL || 'Not set'
      };

      // Test database connection
      let dbStatus = 'Unknown';
      let dbError = null;
      
      try {
        const connection = await getConnection();
        dbStatus = 'Connected';
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        dbStatus = `Connected (test query: ${rows[0].test})`;
      } catch (error) {
        dbStatus = 'Failed';
        dbError = error.message;
      }

      res.status(200).json({
        success: true,
        environment: envCheck,
        database: {
          status: dbStatus,
          error: dbError
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Test DB API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
