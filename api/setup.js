/**
 * Vercel serverless function for database setup
 */

const { query } = require('../lib/database');
const fs = require('fs');
const path = require('path');

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
      // Read and execute database schema
      const schemaPath = path.join(__dirname, '../lib/database-schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split SQL into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      let executedStatements = 0;
      for (const statement of statements) {
        try {
          await query(statement);
          executedStatements++;
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate entry')) {
            console.warn('Schema execution warning:', error.message);
          }
        }
      }
      
      // Initialize current week budget
      await initializeCurrentWeek();
      
      res.status(200).json({
        success: true,
        message: `Database setup completed. ${executedStatements} statements executed.`,
        statements_executed: executedStatements
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Setup API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

async function initializeCurrentWeek() {
  // Get current week date (Wednesday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  let currentWeek;
  if (dayOfWeek === 3) { // Wednesday
    currentWeek = today.toISOString().split('T')[0];
  } else {
    const daysToWednesday = (dayOfWeek + 4) % 7;
    const wednesday = new Date(today);
    wednesday.setDate(today.getDate() - daysToWednesday);
    currentWeek = wednesday.toISOString().split('T')[0];
  }
  
  // Check if current week budget exists
  const checkSql = 'SELECT COUNT(*) as count FROM weekly_budgets WHERE week_date = ?';
  const result = await query(checkSql, [currentWeek]);
  
  if (result[0].count === 0) {
    // Create default budget for current week
    const defaultBudget = [
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
    
    for (const allocation of defaultBudget) {
      const insertSql = `
        INSERT INTO weekly_budgets (week_date, category_id, planned_amount, status) 
        VALUES (?, ?, ?, 'active')
      `;
      await query(insertSql, [currentWeek, allocation.categoryId, allocation.amount]);
    }
  }
}
