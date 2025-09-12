/**
 * Vercel serverless function for weekly budget management
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
    const budgetManager = new BudgetManager();

    if (req.method === 'GET') {
      const weekDate = req.query.date || new Date().toISOString().split('T')[0];
      const budget = await budgetManager.getWeeklyBudget(weekDate);
      
      res.status(200).json({
        success: true,
        data: budget
      });
    } else if (req.method === 'POST') {
      const { week_date, category_id, amount, notes } = req.body;
      
      if (!week_date || !category_id || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: week_date, category_id, amount'
        });
      }

      const result = await budgetManager.setWeeklyBudget(week_date, category_id, amount, notes || '');
      
      res.status(200).json({
        success: result
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Weekly Budget API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
