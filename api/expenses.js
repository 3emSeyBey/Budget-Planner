/**
 * Vercel serverless function for all expense operations
 */

const ExpenseTracker = require('../lib/expense-tracker');

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
    const expenseTracker = new ExpenseTracker();
    
    if (req.method === 'GET') {
      let data;
      
      switch (type) {
        case 'current':
          data = await expenseTracker.getCurrentWeekExpenses();
          break;
        case 'week':
          const weekDate = req.query.date || new Date().toISOString().split('T')[0];
          data = await expenseTracker.getWeeklyExpenses(weekDate);
          break;
        case 'range':
          const startDate = req.query.start;
          const endDate = req.query.end;
          if (!startDate || !endDate) {
            return res.status(400).json({
              success: false,
              message: 'Start date and end date are required for range query'
            });
          }
          data = await expenseTracker.getExpensesByDateRange(startDate, endDate);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid expense type. Use: current, week, or range'
          });
      }
      
      res.status(200).json({
        success: true,
        data: data
      });
    } else if (req.method === 'POST') {
      if (type === 'add') {
        const { week_date, category_id, amount, description, payment_method, location } = req.body;
        
        if (!week_date || !category_id || !amount) {
          return res.status(400).json({
            success: false,
            message: 'Week date, category ID, and amount are required'
          });
        }

        const result = await expenseTracker.addExpense(week_date, category_id, amount, description, payment_method, location);
        
        if (result) {
          res.status(200).json({
            success: true,
            message: 'Expense added successfully',
            data: { expense_id: result }
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Failed to add expense'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid expense type for POST. Use: add'
        });
      }
    } else if (req.method === 'PUT') {
      if (type === 'update') {
        const { expense_id, amount, description, payment_method, location } = req.body;
        
        if (!expense_id || !amount) {
          return res.status(400).json({
            success: false,
            message: 'Expense ID and amount are required'
          });
        }

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
        return res.status(400).json({
          success: false,
          message: 'Invalid expense type for PUT. Use: update'
        });
      }
    } else if (req.method === 'DELETE') {
      if (type === 'delete') {
        const expenseId = req.query.id;
        
        if (!expenseId) {
          return res.status(400).json({
            success: false,
            message: 'Expense ID is required'
          });
        }

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
        return res.status(400).json({
          success: false,
          message: 'Invalid expense type for DELETE. Use: delete'
        });
      }
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Expenses API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
