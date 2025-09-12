/**
 * Vercel serverless function for all analytics endpoints
 */

const ExpenseTracker = require('../lib/expense-tracker');
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
    if (req.method === 'GET') {
      const { type } = req.query;
      const expenseTracker = new ExpenseTracker();
      const smartFeatures = new SmartFeatures();
      
      let data;
      
      switch (type) {
        case 'trends':
          data = await expenseTracker.getSpendingTrends(4);
          break;
        case 'top-categories':
          data = await expenseTracker.getTopSpendingCategories(4);
          break;
        case 'forecast':
          const currentDate = new Date();
          const month = currentDate.getMonth() + 1;
          const year = currentDate.getFullYear();
          data = await smartFeatures.getMonthlyForecast(month, year);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid analytics type. Use: trends, top-categories, or forecast'
          });
      }
      
      res.status(200).json({
        success: true,
        data: data
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
