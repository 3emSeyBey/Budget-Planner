/**
 * Vercel serverless function for current week budget
 */

const BudgetManager = require('../../lib/budget-manager');

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
      const budgetManager = new BudgetManager();
      const budget = await budgetManager.getCurrentWeekBudget();
      
      res.status(200).json({
        success: true,
        data: budget
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Current Budget API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
