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
      console.log('First few statements:', statements.slice(0, 3));
      
      // Log the raw schema for debugging
      console.log('Raw schema length:', schema.length);
      console.log('Schema preview:', schema.substring(0, 200));
      
      // First, ensure we're using the correct database
      try {
        const dbName = process.env.DB_NAME || 'test';
        await query(`USE ${dbName}`);
        console.log(`Using database: ${dbName}`);
      } catch (dbError) {
        console.warn('Could not select database, continuing with current database:', dbError.message);
      }
      
      // Test a simple CREATE TABLE to verify database permissions
      try {
        console.log('Testing simple CREATE TABLE...');
        await query(`
          CREATE TABLE IF NOT EXISTS test_setup_table (
            id INT PRIMARY KEY AUTO_INCREMENT,
            test_field VARCHAR(50)
          )
        `);
        console.log('Simple CREATE TABLE test: SUCCESS');
        
        // Clean up test table
        await query('DROP TABLE IF EXISTS test_setup_table');
        console.log('Test table cleaned up');
      } catch (testError) {
        console.error('Simple CREATE TABLE test failed:', testError.message);
        errors.push(`Database permissions test failed: ${testError.message}`);
      }
      
      let executedStatements = 0;
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
      
      // Check current database first
      try {
        const [dbResult] = await query('SELECT DATABASE() as current_db');
        console.log('Current database:', dbResult[0]?.current_db);
      } catch (dbError) {
        console.error('Error getting current database:', dbError.message);
      }

      // Verify tables were created
      const tableCheck = await verifyTables();
      console.log('Table verification result:', tableCheck);
      
      // Only initialize current week budget if tables were created successfully
      if (tableCheck.weekly_budgets && tableCheck.budget_categories) {
        console.log('Tables verified, initializing current week budget...');
        await initializeCurrentWeek();
      } else {
        console.warn('Tables not created successfully, skipping current week initialization');
        errors.push('Tables were not created successfully - check database permissions and connection');
      }
      
      // Determine if setup was successful
      const setupSuccessful = executedStatements > 0 && tableCheck.weekly_budgets && tableCheck.budget_categories;
      
      res.status(setupSuccessful ? 200 : 500).json({
        success: setupSuccessful,
        message: setupSuccessful 
          ? `Database setup completed successfully. ${executedStatements} statements executed.`
          : `Database setup failed. ${executedStatements} statements executed, but tables were not created properly.`,
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
