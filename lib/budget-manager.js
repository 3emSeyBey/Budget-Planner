/**
 * Budget Manager for Vercel serverless functions
 * Handles all budget-related operations
 */

const { queryBuilder } = require('./database');

class BudgetManager {
  /**
   * Get all budget categories
   */
  async getCategories() {
    return await queryBuilder.getBudgetCategories();
  }

  /**
   * Get weekly budget for a specific date
   */
  async getWeeklyBudget(weekDate) {
    const weeklyBudgets = await queryBuilder.getWeeklyBudgets(weekDate);
    
    // Get expenses for the same week to calculate actual amounts
    const expenses = await queryBuilder.getExpenses(weekDate);
    
    // Combine budget and expense data
    const budgetWithExpenses = weeklyBudgets.map(budget => {
      const categoryExpenses = expenses.filter(expense => expense.category_id === budget.category_id);
      const actualAmount = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      return {
        ...budget,
        actual_amount: actualAmount
      };
    });
    
    return budgetWithExpenses;
  }

  /**
   * Create or update weekly budget
   */
  async setWeeklyBudget(weekDate, categoryId, amount, actionPlan = 'spend', notes = '') {
    // Check if budget already exists for this week and category
    const existingBudgets = await queryBuilder.getWeeklyBudgets(weekDate);
    const existingBudget = existingBudgets.find(budget => budget.category_id === categoryId);
    
    if (existingBudget) {
      // Update existing budget
      return await queryBuilder.updateWeeklyBudget(existingBudget.id, {
        planned_amount: amount,
        action_plan: actionPlan,
        notes: notes
      });
    } else {
      // Insert new budget
      const budgetData = {
        week_date: weekDate,
        category_id: categoryId,
        planned_amount: amount,
        action_plan: actionPlan,
        notes: notes,
        status: 'active'
      };
      return await queryBuilder.insertWeeklyBudget(budgetData);
    }
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
    const budgets = await queryBuilder.getWeeklyBudgets(weekDate);
    const budget = budgets.find(b => b.category_id === categoryId);
    return budget ? budget.planned_amount : 0;
  }

  /**
   * Get budget summary for a week
   */
  async getWeeklySummary(weekDate) {
    const budgets = await queryBuilder.getWeeklyBudgets(weekDate);
    const expenses = await queryBuilder.getExpenses(weekDate);
    
    const totalPlanned = budgets.reduce((sum, budget) => sum + parseFloat(budget.planned_amount), 0);
    const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    return {
      total_planned: totalPlanned,
      total_spent: totalSpent,
      category_count: budgets.length
    };
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
        await this.setWeeklyBudget(weekDate, budgetItem.category_id, budgetItem.planned_amount, budgetItem.action_plan || 'spend');
      }
    }
    return true;
  }

  /**
   * Set default budget allocation
   */
  async setDefaultBudget(weekDate) {
    const defaultAllocations = [
      { categoryId: 1, amount: 750, actionPlan: 'spend' },   // Phone
      { categoryId: 2, amount: 500, actionPlan: 'spend' },   // Groceries
      { categoryId: 3, amount: 1750, actionPlan: 'spend' },  // Rent
      { categoryId: 4, amount: 400, actionPlan: 'spend' },   // Electric
      { categoryId: 5, amount: 900, actionPlan: 'spend' },   // Motorbike
      { categoryId: 6, amount: 1050, actionPlan: 'spend' },  // Daily Expense
      { categoryId: 7, amount: 1000, actionPlan: 'save' },   // Savings
      { categoryId: 8, amount: 0, actionPlan: 'spend' },     // GCredit
      { categoryId: 9, amount: 3650, actionPlan: 'spend' },  // CIMB Credit
      { categoryId: 10, amount: 2000, actionPlan: 'spend' }, // Misc
      { categoryId: 11, amount: 0, actionPlan: 'spend' }     // Extra Debts
    ];
    
    for (const allocation of defaultAllocations) {
      await this.setWeeklyBudget(weekDate, allocation.categoryId, allocation.amount, allocation.actionPlan, 'Default allocation');
    }
  }

  /**
   * Update weekly budget limit
   */
  async updateWeeklyBudgetLimit(weeklyBudgetLimit) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Check if summary exists for current date
    const existingSummary = await queryBuilder.getWeeklySummary(currentDate);
    
    if (existingSummary) {
      // Update existing summary
      await queryBuilder.updateWeeklySummary(currentDate, {
        weekly_budget_limit: weeklyBudgetLimit
      });
    } else {
      // Insert new summary
      const summaryData = {
        week_date: currentDate,
        total_planned: 0,
        weekly_budget_limit: weeklyBudgetLimit,
        total_spent: 0,
        total_saved: 0,
        remaining_budget: weeklyBudgetLimit,
        budget_utilization: 0
      };
      await queryBuilder.insertWeeklySummary(summaryData);
    }
    
    return weeklyBudgetLimit;
  }

  /**
   * Get weekly budget limit
   */
  async getWeeklyBudgetLimit() {
    // For now, return default value since we don't have a direct way to get the latest limit
    // In a real implementation, you might want to add a method to get the latest summary
    return 12000; // Default to 12000
  }
}

module.exports = BudgetManager;
