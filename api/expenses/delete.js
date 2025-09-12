/**
 * Vercel serverless function for deleting expenses
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
    if (req.method === 'DELETE') {
      const expenseId = req.query.id;
      
      if (!expenseId) {
        return res.status(400).json({
          success: false,
          message: 'Expense ID is required'
        });
      }

      const expenseTracker = new ExpenseTracker();
      const result = await expenseTracker.deleteExpense(expenseId);
      
      if (result) {
        res.status(200).json({
          success: true,
          message: 'Expense deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Delete Expense API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
