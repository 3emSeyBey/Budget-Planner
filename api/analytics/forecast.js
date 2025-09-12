/**
 * Vercel serverless function for monthly forecast analytics
 */

const SmartFeatures = require('../../lib/smart-features');

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
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const smartFeatures = new SmartFeatures();
      const forecast = await smartFeatures.getMonthlyForecast(month, year);
      
      res.status(200).json({
        success: true,
        data: forecast
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Analytics Forecast API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
