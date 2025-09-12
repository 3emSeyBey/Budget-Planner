/**
 * Vercel serverless function for adding expenses
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
    if (req.method === 'POST') {
      const { week_date, category_id, amount, description, payment_method, location } = req.body;
      
      if (!week_date || !category_id || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: week_date, category_id, amount'
        });
      }

      const expenseTracker = new ExpenseTracker();
      const expenseId = await expenseTracker.addExpense(
        week_date,
        category_id,
        amount,
        description || '',
        payment_method || '',
        location || ''
      );
      
      res.status(200).json({
        success: expenseId !== false,
        expense_id: expenseId
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Add Expense API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
