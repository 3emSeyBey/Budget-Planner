/**
 * Vercel serverless function for recommendations
 */

const { query } = require('../lib/database');

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
    // Get non-essential spending data from the last 4 weeks
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
          category_id: category.category_id,
          category_name: category.category_name,
          current_spending: Math.round(category.avg_spending),
          potential_savings: Math.round(potentialSavings),
          frequency: category.frequency,
          recommendation: `Reduce ${category.category_name} spending by 20% to save ₱${Math.round(potentialSavings)} per week`,
          priority: 'medium'
        });
      }
    }
    
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
