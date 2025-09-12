/**
 * Vercel serverless function for auto-adjusting next week's budget
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
    if (req.method === 'POST') {
      const { week_date } = req.body;
      const smartFeatures = new SmartFeatures();
      const adjustmentsMade = await smartFeatures.autoAdjustNextWeek(week_date);
      
      res.status(200).json({
        success: true,
        data: { adjustments_made: adjustmentsMade }
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Adjust API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
