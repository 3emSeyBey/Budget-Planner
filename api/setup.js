/**
 * Vercel serverless function for database setup
 */

const { query } = require('../lib/database');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  console.log('Setup API called:', req.method, req.url);
  
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
      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({
          success: false,
          message: 'DATABASE_URL environment variable is not set. Please configure your database connection in Vercel.'
        });
      }

      // Read and execute database schema
      const schemaPath = path.join(__dirname, '../lib/database-schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        return res.status(500).json({
          success: false,
          message: 'Database schema file not found. Please check your deployment.'
        });
      }

      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split SQL into individual statements and clean them
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
        .map(stmt => stmt.replace(/\s+/g, ' ').trim());
      
      console.log(`Found ${statements.length} SQL statements to execute`);
      
      let executedStatements = 0;
      let errors = [];
      let warnings = [];
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;
        
        try {
          console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
          await query(statement);
          executedStatements++;
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
          console.error(`Statement: ${statement}`);
          
          // Check if it's a "table already exists" error (which is OK)
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate entry') ||
              error.message.includes('Table') && error.message.includes('already exists')) {
            warnings.push(`Statement ${i + 1}: ${error.message}`);
            console.log(`Statement ${i + 1} skipped (already exists)`);
          } else {
            errors.push(`Statement ${i + 1}: ${error.message}`);
            console.error(`Statement ${i + 1} failed:`, error.message);
          }
        }
      }
      
      console.log(`Schema execution completed: ${executedStatements} statements executed, ${errors.length} errors, ${warnings.length} warnings`);
      
      // Verify tables were created
      const tableCheck = await verifyTables();
      console.log('Table verification result:', tableCheck);
      
      // Initialize current week budget
      await initializeCurrentWeek();
      
      res.status(200).json({
        success: true,
        message: `Database setup completed. ${executedStatements} statements executed.`,
        statements_executed: executedStatements,
        total_statements: statements.length,
        table_verification: tableCheck,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
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
      message: `Database setup failed: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

async function verifyTables() {
  try {
    const tables = ['budget_categories', 'weekly_budgets', 'expenses', 'budget_adjustments', 'savings_goals', 'weekly_summaries'];
    const results = {};
    
    for (const table of tables) {
      try {
        const result = await query(`SHOW TABLES LIKE '${table}'`);
        results[table] = result.length > 0;
        console.log(`Table ${table}: ${result.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
      } catch (error) {
        results[table] = false;
        console.error(`Error checking table ${table}:`, error.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error verifying tables:', error.message);
    return { error: error.message };
  }
}
