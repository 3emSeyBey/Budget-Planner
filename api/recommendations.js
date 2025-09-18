/**
 * Vercel serverless function for recommendations
 */

const { queryBuilder } = require('../lib/database');

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
    if (req.method === 'GET') {
      const { type } = req.query;
      
      let data;
      
      switch (type) {
        case 'savings':
          data = await getSavingsRecommendations();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid recommendation type. Use: savings'
          });
      }
      
      res.status(200).json({
        success: true,
        data: data
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Recommendations API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

async function getSavingsRecommendations() {
  try {
    // Get non-essential categories and recent expenses
    const categories = await queryBuilder.getBudgetCategories();
    const nonEssentialCategories = categories.filter(cat => !cat.is_essential);
    
    // Get expenses from the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];
    
    const allExpenses = await queryBuilder.getExpenses();
    const recentExpenses = allExpenses.filter(expense => expense.week_date >= fourWeeksAgoStr);
    
    // Calculate spending by category
    const categorySpending = {};
    recentExpenses.forEach(expense => {
      if (!categorySpending[expense.category_id]) {
        categorySpending[expense.category_id] = {
          total: 0,
          count: 0,
          category: expense.budget_categories
        };
      }
      categorySpending[expense.category_id].total += parseFloat(expense.amount);
      categorySpending[expense.category_id].count += 1;
    });
    
    const recommendations = [];
    
    // Generate recommendations for non-essential categories with significant spending
    nonEssentialCategories.forEach(category => {
      const spending = categorySpending[category.id];
      if (spending && spending.total > 0) {
        const avgSpending = spending.total / Math.max(spending.count, 1);
        const potentialSavings = avgSpending * 0.2; // 20% reduction
        
        if (potentialSavings > 50) {
          recommendations.push({
            category_id: category.id,
            category_name: category.name,
            current_spending: Math.round(avgSpending),
            potential_savings: Math.round(potentialSavings),
            frequency: spending.count,
            recommendation: `Reduce ${category.name} spending by 20% to save ₱${Math.round(potentialSavings)} per week`,
            priority: 'medium'
          });
        }
      }
    });
    
    // Sort by potential savings
    recommendations.sort((a, b) => b.potential_savings - a.potential_savings);
    
    // If no spending data, provide general recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        category_id: null,
        category_name: 'General',
        current_spending: 0,
        potential_savings: 500,
        frequency: 0,
        recommendation: 'Start tracking expenses to identify savings opportunities',
        priority: 'low'
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error getting savings recommendations:', error);
    // Return fallback recommendations
    return [
      {
        category_id: null,
        category_name: 'General',
        current_spending: 0,
        potential_savings: 500,
        frequency: 0,
        recommendation: 'Start tracking expenses to identify savings opportunities',
        priority: 'low'
      }
    ];
  }
}
