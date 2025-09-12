/**
 * Budget Manager for Vercel serverless functions
 * Handles all budget-related operations
 */

const { query } = require('./database');

class BudgetManager {
  /**
   * Get all budget categories
   */
  async getCategories() {
    const sql = `
      SELECT * FROM budget_categories 
      ORDER BY priority_order ASC
    `;
    return await query(sql);
  }

  /**
   * Get weekly budget for a specific date
   */
  async getWeeklyBudget(weekDate) {
    const sql = `
      SELECT 
        wb.*, 
        bc.name as category_name, 
        bc.bank, 
        bc.is_essential,
        COALESCE(SUM(e.amount), 0) as actual_amount
      FROM weekly_budgets wb 
      JOIN budget_categories bc ON wb.category_id = bc.id 
      LEFT JOIN expenses e ON wb.category_id = e.category_id AND wb.week_date = e.week_date
      WHERE wb.week_date = ? 
      GROUP BY wb.id, wb.week_date, wb.category_id, wb.planned_amount, wb.notes, wb.created_at, wb.updated_at, bc.name, bc.bank, bc.is_essential
      ORDER BY bc.priority_order
    `;
    return await query(sql, [weekDate]);
  }

  /**
   * Create or update weekly budget
   */
  async setWeeklyBudget(weekDate, categoryId, amount, notes = '') {
    const sql = `
      INSERT INTO weekly_budgets 
      (week_date, category_id, planned_amount, notes) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      planned_amount = VALUES(planned_amount), 
      notes = VALUES(notes),
      updated_at = CURRENT_TIMESTAMP
    `;
    return await query(sql, [weekDate, categoryId, amount, notes]);
  }

  /**
   * Get current week's budget (Wednesday to Wednesday)
   */
  async getCurrentWeekBudget() {
    const weekDate = this.getCurrentWeekDate();
    let budget = await this.getWeeklyBudget(weekDate);
    
    // If no budget exists for this week, initialize it
    if (budget.length === 0) {
      await this.initializeNewWeek(weekDate);
      budget = await this.getWeeklyBudget(weekDate);
    }
    
    return budget;
  }

  /**
   * Get next week's budget
   */
  async getNextWeekBudget() {
    const currentWeek = this.getCurrentWeekDate();
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return await this.getWeeklyBudget(nextWeek.toISOString().split('T')[0]);
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

  /**
   * Smart budget adjustment
   */
  async smartAdjustBudget(weekDate, categoryId, newAmount) {
    const currentBudget = await this.getWeeklyBudget(weekDate);
    const totalPlanned = currentBudget.reduce((sum, item) => sum + parseFloat(item.planned_amount), 0);
    const currentAmount = currentBudget.find(item => item.category_id === categoryId)?.planned_amount || 0;
    const difference = newAmount - currentAmount;
    
    if (totalPlanned + difference > 12000) {
      await this.autoReduceCategories(weekDate, categoryId, Math.abs(difference));
    }
    
    return await this.setWeeklyBudget(weekDate, categoryId, newAmount, 'Smart adjustment');
  }

  /**
   * Automatically reduce other categories when budget exceeds 12k
   */
  async autoReduceCategories(weekDate, excludeCategoryId, amountToReduce) {
    const categories = await this.getCategories();
    const reductionPerCategory = amountToReduce / (categories.length - 1);
    
    for (const category of categories) {
      if (category.id !== excludeCategoryId && !category.is_essential) {
        const currentAmount = await this.getCategoryAmount(weekDate, category.id);
        const newAmount = Math.max(0, currentAmount - reductionPerCategory);
        await this.setWeeklyBudget(weekDate, category.id, newAmount, 'Auto-reduced for budget balance');
      }
    }
  }

  /**
   * Get amount for specific category in specific week
   */
  async getCategoryAmount(weekDate, categoryId) {
    const sql = `
      SELECT planned_amount FROM weekly_budgets 
      WHERE week_date = ? AND category_id = ?
    `;
    const result = await query(sql, [weekDate, categoryId]);
    return result.length > 0 ? result[0].planned_amount : 0;
  }

  /**
   * Get budget summary for a week
   */
  async getWeeklySummary(weekDate) {
    const sql = `
      SELECT 
        SUM(planned_amount) as total_planned,
        SUM(actual_amount) as total_spent,
        COUNT(*) as category_count
      FROM weekly_budgets 
      WHERE week_date = ?
    `;
    const result = await query(sql, [weekDate]);
    return result[0];
  }

  /**
   * Initialize budget for a new week
   */
  async initializeNewWeek(weekDate) {
    const previousWeek = new Date(weekDate);
    previousWeek.setDate(previousWeek.getDate() - 7);
    const previousWeekStr = previousWeek.toISOString().split('T')[0];
    
    const previousBudget = await this.getWeeklyBudget(previousWeekStr);
    
    if (previousBudget.length === 0) {
      await this.setDefaultBudget(weekDate);
    } else {
      for (const budgetItem of previousBudget) {
        await this.setWeeklyBudget(weekDate, budgetItem.category_id, budgetItem.planned_amount);
      }
    }
    return true;
  }

  /**
   * Set default budget allocation
   */
  async setDefaultBudget(weekDate) {
    const defaultAllocations = [
      { categoryId: 1, amount: 750 },   // Phone
      { categoryId: 2, amount: 500 },   // Groceries
      { categoryId: 3, amount: 1750 },  // Rent
      { categoryId: 4, amount: 400 },   // Electric
      { categoryId: 5, amount: 900 },   // Motorbike
      { categoryId: 6, amount: 1050 },  // Daily Expense
      { categoryId: 7, amount: 1000 },  // Savings
      { categoryId: 8, amount: 0 },     // GCredit
      { categoryId: 9, amount: 3650 },  // CIMB Credit
      { categoryId: 10, amount: 2000 }, // Misc
      { categoryId: 11, amount: 0 }     // Extra Debts
    ];
    
    for (const allocation of defaultAllocations) {
      await this.setWeeklyBudget(weekDate, allocation.categoryId, allocation.amount, 'Default allocation');
    }
  }
}

module.exports = BudgetManager;
