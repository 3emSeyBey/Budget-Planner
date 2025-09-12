/**
 * Vercel serverless function for spending trends analytics
 */

const ExpenseTracker = require('../../lib/expense-tracker');

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
      const expenseTracker = new ExpenseTracker();
      const trends = await expenseTracker.getSpendingTrends(4);
      
      res.status(200).json({
        success: true,
        data: trends
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Analytics Trends API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
