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
        case 'weekly-limit':
          data = { weekly_budget_limit: await budgetManager.getWeeklyBudgetLimit() };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid budget type. Use: current, week, or weekly-limit'
          });
      }
      
      res.status(200).json({
        success: true,
        data: data
      });
    } else if (req.method === 'POST') {
      if (type === 'week') {
        const { week_date, category_id, amount, action_plan, notes } = req.body;
        
        if (!week_date || !category_id || !amount) {
          return res.status(400).json({
            success: false,
            message: 'Week date, category ID, and amount are required'
          });
        }

        const result = await budgetManager.setWeeklyBudget(week_date, category_id, amount, action_plan || 'spend', notes);
        
        res.status(200).json({
          success: true,
          message: 'Budget updated successfully'
        });
      } else if (type === 'update-weekly-limit') {
        const { weekly_budget_limit } = req.body;
        
        if (!weekly_budget_limit || weekly_budget_limit <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Valid weekly budget limit is required'
          });
        }

        const result = await budgetManager.updateWeeklyBudgetLimit(weekly_budget_limit);
        
        res.status(200).json({
          success: true,
          message: 'Weekly budget limit updated successfully',
          data: { weekly_budget_limit: result }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid budget type for POST. Use: week or update-weekly-limit'
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
