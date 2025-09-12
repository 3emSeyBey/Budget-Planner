/**
 * Vercel serverless function for all smart features
 */

const SmartFeatures = require('../lib/smart-features');

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
    const { type } = req.query;
    const smartFeatures = new SmartFeatures();
    const weekDate = req.query.date || new Date().toISOString().split('T')[0];
    
    let data;
    
    if (req.method === 'GET') {
      switch (type) {
        case 'alerts':
          data = await smartFeatures.getSpendingAlerts(weekDate);
          break;
        case 'health':
          const healthScore = await smartFeatures.getBudgetHealthScore(weekDate);
          data = { health_score: healthScore };
          break;
        case 'predict':
          data = await smartFeatures.predictNextWeekBudget();
          break;
        case 'reallocate':
          data = await smartFeatures.smartReallocate(weekDate);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid smart feature type. Use: alerts, health, predict, or reallocate'
          });
      }
    } else if (req.method === 'POST') {
      switch (type) {
        case 'adjust':
          const { week_date } = req.body;
          const adjustmentsMade = await smartFeatures.autoAdjustNextWeek(week_date);
          data = { adjustments_made: adjustmentsMade };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid smart feature type for POST. Use: adjust'
          });
      }
    } else {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Smart Features API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
