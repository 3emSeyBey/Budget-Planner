/**
 * Expense Tracker for Vercel serverless functions
 * Handles expense recording and tracking
 */

const { query } = require('./database');

class ExpenseTracker {
  /**
   * Add new expense
   */
  async addExpense(weekDate, categoryId, amount, description = '', paymentMethod = '', location = '') {
    const sql = `
      INSERT INTO expenses 
      (week_date, category_id, amount, description, payment_method, location) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [weekDate, categoryId, amount, description, paymentMethod, location]);
    
    if (result.insertId) {
      await this.updateBudgetActual(weekDate, categoryId);
      return result.insertId;
    }
    return false;
  }

  /**
   * Update actual amount in budget
   */
  async updateBudgetActual(weekDate, categoryId) {
    const sql = `
      UPDATE weekly_budgets 
      SET actual_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM expenses 
        WHERE week_date = ? AND category_id = ?
      )
      WHERE week_date = ? AND category_id = ?
    `;
    await query(sql, [weekDate, categoryId, weekDate, categoryId]);
  }

  /**
   * Get expenses for a specific week
   */
  async getWeeklyExpenses(weekDate) {
    const sql = `
      SELECT e.*, bc.name as category_name, bc.bank 
      FROM expenses e
      JOIN budget_categories bc ON e.category_id = bc.id
      WHERE e.week_date = ? 
      ORDER BY e.created_at DESC
    `;
    return await query(sql, [weekDate]);
  }

  /**
   * Get expenses by category for a week
   */
  async getExpensesByCategory(weekDate, categoryId) {
    const sql = `
      SELECT * FROM expenses 
      WHERE week_date = ? AND category_id = ? 
      ORDER BY created_at DESC
    `;
    return await query(sql, [weekDate, categoryId]);
  }

  /**
   * Get expense summary for a week
   */
  async getWeeklyExpenseSummary(weekDate) {
    const sql = `
      SELECT 
        bc.name as category_name,
        bc.bank,
        COALESCE(SUM(e.amount), 0) as total_spent,
        COUNT(e.id) as transaction_count,
        wb.planned_amount,
        (COALESCE(SUM(e.amount), 0) - wb.planned_amount) as variance
      FROM budget_categories bc
      LEFT JOIN weekly_budgets wb ON bc.id = wb.category_id AND wb.week_date = ?
      LEFT JOIN expenses e ON bc.id = e.category_id AND e.week_date = ?
      GROUP BY bc.id, bc.name, bc.bank, wb.planned_amount
      ORDER BY bc.priority_order
    `;
    return await query(sql, [weekDate, weekDate]);
  }

  /**
   * Get spending trends for analytics
   */
  async getSpendingTrends(weeks = 4) {
    const sql = `
      SELECT 
        week_date,
        SUM(amount) as total_spent,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction
      FROM expenses 
      WHERE week_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
      GROUP BY week_date 
      ORDER BY week_date DESC
    `;
    return await query(sql, [weeks]);
  }

  /**
   * Get top spending categories
   */
  async getTopSpendingCategories(weeks = 4) {
    const sql = `
      SELECT 
        bc.name as category_name,
        bc.bank,
        SUM(e.amount) as total_spent,
        COUNT(e.id) as transaction_count,
        AVG(e.amount) as avg_transaction
      FROM expenses e
      JOIN budget_categories bc ON e.category_id = bc.id
      WHERE e.week_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
      GROUP BY bc.id, bc.name, bc.bank
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    return await query(sql, [weeks]);
  }

  /**
   * Delete expense
   */
  async deleteExpense(expenseId) {
    // Get expense details first
    const getExpenseSql = `
      SELECT week_date, category_id FROM expenses WHERE id = ?
    `;
    const expense = await query(getExpenseSql, [expenseId]);
    
    if (expense.length > 0) {
      // Delete the expense
      const deleteSql = `DELETE FROM expenses WHERE id = ?`;
      const result = await query(deleteSql, [expenseId]);
      
      if (result.affectedRows > 0) {
        // Update budget actual amount
        await this.updateBudgetActual(expense[0].week_date, expense[0].category_id);
        return true;
      }
    }
    return false;
  }

  /**
   * Update expense
   */
  async updateExpense(expenseId, amount, description = '', paymentMethod = '', location = '') {
    // Get current expense details
    const getExpenseSql = `
      SELECT week_date, category_id FROM expenses WHERE id = ?
    `;
    const expense = await query(getExpenseSql, [expenseId]);
    
    if (expense.length > 0) {
      // Update the expense
      const updateSql = `
        UPDATE expenses 
        SET amount = ?, description = ?, payment_method = ?, location = ?
        WHERE id = ?
      `;
      
      const result = await query(updateSql, [amount, description, paymentMethod, location, expenseId]);
      
      if (result.affectedRows > 0) {
        // Update budget actual amount
        await this.updateBudgetActual(expense[0].week_date, expense[0].category_id);
        return true;
      }
    }
    return false;
  }

  /**
   * Get current week's expenses
   */
  async getCurrentWeekExpenses() {
    const weekDate = this.getCurrentWeekDate();
    let expenses = await this.getWeeklyExpenses(weekDate);
    
    // If no expenses exist, return empty array
    return expenses || [];
  }

  /**
   * Get current week date (Wednesday)
   */
  getCurrentWeekDate() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (dayOfWeek === 3) { // Wednesday
      return today.toISOString().split('T')[0];
    } else {
      const daysToWednesday = (dayOfWeek + 4) % 7;
      const wednesday = new Date(today);
      wednesday.setDate(today.getDate() - daysToWednesday);
      return wednesday.toISOString().split('T')[0];
    }
  }
}

module.exports = ExpenseTracker;
