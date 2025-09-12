/**
 * Vercel serverless function for updating expenses
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
    if (req.method === 'PUT') {
      const { expense_id, amount, description, payment_method, location } = req.body;
      
      if (!expense_id || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Expense ID and amount are required'
        });
      }

      const expenseTracker = new ExpenseTracker();
      const result = await expenseTracker.updateExpense(expense_id, amount, description, payment_method, location);
      
      if (result) {
        res.status(200).json({
          success: true,
          message: 'Expense updated successfully'
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
    console.error('Update Expense API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
