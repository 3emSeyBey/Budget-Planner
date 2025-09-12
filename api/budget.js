/**
 * Vercel serverless function for all budget operations
 */

const BudgetManager = require('../lib/budget-manager');

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
    const budgetManager = new BudgetManager();
    
    if (req.method === 'GET') {
      let data;
      
      switch (type) {
        case 'current':
          data = await budgetManager.getCurrentWeekBudget();
          break;
        case 'week':
          const weekDate = req.query.date || new Date().toISOString().split('T')[0];
          data = await budgetManager.getWeeklyBudget(weekDate);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid budget type. Use: current or week'
          });
      }
      
      res.status(200).json({
        success: true,
        data: data
      });
    } else if (req.method === 'POST') {
      if (type === 'week') {
        const { week_date, category_id, amount, notes } = req.body;
        
        if (!week_date || !category_id || !amount) {
          return res.status(400).json({
            success: false,
            message: 'Week date, category ID, and amount are required'
          });
        }

        const result = await budgetManager.setWeeklyBudget(week_date, category_id, amount, notes);
        
        res.status(200).json({
          success: true,
          message: 'Budget updated successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid budget type for POST. Use: week'
        });
      }
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Budget API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
