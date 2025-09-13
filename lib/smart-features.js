/**
 * Smart Features for Vercel serverless functions
 * Advanced budget management and analytics
 */

const { query } = require('./database');
const BudgetManager = require('./budget-manager');
const ExpenseTracker = require('./expense-tracker');

class SmartFeatures {
  constructor() {
    this.budgetManager = new BudgetManager();
    this.expenseTracker = new ExpenseTracker();
  }

  /**
   * Smart budget reallocation based on spending patterns
   */
  async smartReallocate(weekDate) {
    const expenseSummary = await this.expenseTracker.getWeeklyExpenseSummary(weekDate);
    const reallocations = [];
    
    for (const category of expenseSummary) {
      const variance = category.variance;
      const utilization = category.planned_amount > 0 ? 
        (category.total_spent / category.planned_amount) * 100 : 0;
      
      // If spending is significantly under budget, suggest reallocation
      if (variance < -200 && utilization < 50) {
        reallocations.push({
          category: category.category_name,
          current_amount: category.planned_amount,
          suggested_reduction: Math.abs(variance) * 0.5,
          reason: 'Underutilized budget - can be reallocated'
        });
      }
      
      // If spending is over budget, suggest increase
      if (variance > 200) {
        reallocations.push({
          category: category.category_name,
          current_amount: category.planned_amount,
          suggested_increase: variance * 0.3,
          reason: 'Consistently over budget - needs more allocation'
        });
      }
    }
    
    return reallocations;
  }

  /**
   * Predict next week's budget based on historical data
   */
  async predictNextWeekBudget(weeksHistory = 4) {
    const sql = `
      SELECT 
        bc.id as category_id,
        bc.name as category_name,
        bc.priority_order,
        AVG(e.amount) as avg_weekly_spending,
        STDDEV(e.amount) as spending_volatility,
        COUNT(e.id) as transaction_frequency
      FROM expenses e
      JOIN budget_categories bc ON e.category_id = bc.id
      WHERE e.week_date >= date('now', '-' || ? || ' weeks')
      GROUP BY bc.id, bc.name, bc.priority_order
      ORDER BY bc.priority_order
    `;
    
    const predictions = await query(sql, [weeksHistory]);
    
    let totalPredicted = 0;
    for (const prediction of predictions) {
      // Add 10% buffer for volatility
      prediction.suggested_amount = prediction.avg_weekly_spending * 1.1;
      totalPredicted += prediction.suggested_amount;
    }
    
    // Normalize to fit 12k budget
    if (totalPredicted > 12000) {
      const ratio = 12000 / totalPredicted;
      for (const prediction of predictions) {
        prediction.suggested_amount *= ratio;
      }
    }
    
    return predictions;
  }

  /**
   * Get budget health score (0-100)
   */
  async getBudgetHealthScore(weekDate) {
    const expenseSummary = await this.expenseTracker.getWeeklyExpenseSummary(weekDate);
    const totalPlanned = expenseSummary.reduce((sum, item) => sum + parseFloat(item.planned_amount || 0), 0);
    const totalSpent = expenseSummary.reduce((sum, item) => sum + parseFloat(item.total_spent || 0), 0);
    
    let score = 100;
    
    // Deduct points for over-budget categories
    for (const category of expenseSummary) {
      if (category.variance > 0) {
        const overagePercentage = (category.variance / category.planned_amount) * 100;
        score -= Math.min(20, overagePercentage * 2); // Max 20 points deduction per category
      }
    }
    
    // Bonus points for staying within total budget
    if (totalSpent <= 12000) {
      score += 10;
    }
    
    // Deduct points for significant under-utilization
    const utilization = (totalSpent / 12000) * 100;
    if (utilization < 70) {
      score -= (70 - utilization) * 0.5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get spending alerts and recommendations
   */
  async getSpendingAlerts(weekDate) {
    const alerts = [];
    const expenseSummary = await this.expenseTracker.getWeeklyExpenseSummary(weekDate);
    const totalSpent = expenseSummary.reduce((sum, item) => sum + parseFloat(item.total_spent || 0), 0);
    
    // Check if approaching weekly limit
    if (totalSpent > 10000) {
      alerts.push({
        type: 'warning',
        message: `You've spent ₱${totalSpent.toLocaleString()} this week. Only ₱${(12000 - totalSpent).toLocaleString()} remaining.`,
        priority: 'high'
      });
    }
    
    // Check individual category overages
    for (const category of expenseSummary) {
      if (category.variance > 500) {
        alerts.push({
          type: 'danger',
          message: `${category.category_name} is ₱${category.variance.toLocaleString()} over budget`,
          priority: 'high'
        });
      } else if (category.variance > 200) {
        alerts.push({
          type: 'warning',
          message: `${category.category_name} is ₱${category.variance.toLocaleString()} over budget`,
          priority: 'medium'
        });
      }
    }
    
    // Check for unusual spending patterns
    const recentExpenses = await this.expenseTracker.getSpendingTrends(2);
    if (recentExpenses.length >= 2) {
      const currentWeek = recentExpenses[0].total_spent;
      const previousWeek = recentExpenses[1].total_spent;
      const increase = ((currentWeek - previousWeek) / previousWeek) * 100;
      
      if (increase > 30) {
        alerts.push({
          type: 'info',
          message: `Spending increased by ${increase.toFixed(1)}% compared to last week`,
          priority: 'medium'
        });
      }
    }
    
    return alerts;
  }

  /**
   * Auto-adjust budget for next week based on current week's performance
   */
  async autoAdjustNextWeek(currentWeekDate) {
    const nextWeekDate = new Date(currentWeekDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekDateStr = nextWeekDate.toISOString().split('T')[0];
    
    const expenseSummary = await this.expenseTracker.getWeeklyExpenseSummary(currentWeekDate);
    
    let adjustmentsMade = 0;
    
    for (const category of expenseSummary) {
      const variance = category.variance;
      const utilization = category.planned_amount > 0 ? 
        (category.total_spent / category.planned_amount) * 100 : 0;
      
      // If consistently over budget, increase allocation
      if (variance > 300 && utilization > 120) {
        const newAmount = category.planned_amount + (variance * 0.2);
        await this.budgetManager.setWeeklyBudget(nextWeekDateStr, category.category_id, newAmount, 'Auto-adjusted based on spending pattern');
        adjustmentsMade++;
      }
      
      // If consistently under budget, decrease allocation
      if (variance < -300 && utilization < 60) {
        const newAmount = Math.max(0, category.planned_amount + (variance * 0.3));
        await this.budgetManager.setWeeklyBudget(nextWeekDateStr, category.category_id, newAmount, 'Auto-adjusted based on spending pattern');
        adjustmentsMade++;
      }
    }
    
    return adjustmentsMade;
  }

  /**
   * Get monthly spending forecast
   */
  async getMonthlyForecast(month, year) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        bc.id as category_id,
        bc.name as category_name,
        bc.priority_order,
        SUM(e.amount) as total_spent,
        COUNT(e.id) as transaction_count,
        AVG(e.amount) as avg_transaction
      FROM expenses e
      JOIN budget_categories bc ON e.category_id = bc.id
      WHERE e.week_date >= ? AND e.week_date <= ?
      GROUP BY bc.id, bc.name, bc.priority_order
      ORDER BY total_spent DESC
    `;
    
    const monthlyData = await query(sql, [startDate, endDate]);
    const totalMonthly = monthlyData.reduce((sum, item) => sum + parseFloat(item.total_spent || 0), 0);
    
    return {
      month: month,
      year: year,
      total_spent: totalMonthly,
      categories: monthlyData,
      daily_average: totalMonthly / new Date(year, month, 0).getDate()
    };
  }

  /**
   * Get savings recommendations
   */
  async getSavingsRecommendations() {
    const sql = `
      SELECT 
        bc.id as category_id,
        bc.name as category_name,
        bc.priority_order,
        AVG(e.amount) as avg_spending,
        COUNT(e.id) as frequency,
        SUM(e.amount) as total_spent
      FROM expenses e
      JOIN budget_categories bc ON e.category_id = bc.id
      WHERE e.week_date >= date('now', '-4 weeks')
      AND bc.is_essential = 0
      GROUP BY bc.id, bc.name, bc.priority_order
      HAVING avg_spending > 100
      ORDER BY total_spent DESC
    `;
    
    const nonEssentialSpending = await query(sql);
    
    const recommendations = [];
    for (const category of nonEssentialSpending) {
      const potentialSavings = category.avg_spending * 0.2; // 20% reduction
      if (potentialSavings > 50) {
        recommendations.push({
          category: category.category_name,
          current_spending: category.avg_spending,
          potential_savings: potentialSavings,
          suggestion: `Consider reducing ${category.category_name} spending by 20% to save ₱${potentialSavings.toLocaleString()} per week`
        });
      }
    }
    
    return recommendations;
  }
}

module.exports = SmartFeatures;
