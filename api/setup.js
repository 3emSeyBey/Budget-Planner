/**
 * Vercel serverless function for database setup
 */

const { queryBuilder } = require('../lib/database');
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
      // Check if Supabase environment variables are set
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Supabase environment variables are not set. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.'
        });
      }

      console.log('Verifying Supabase connection and tables...');
      
      // Initialize error tracking
      let errors = [];
      let warnings = [];
      
      // Test database connection by trying to read from tables
      try {
        console.log('Testing database connection...');
        const categories = await queryBuilder.getBudgetCategories();
        console.log(`✅ Database connection successful. Found ${categories.length} budget categories.`);
      } catch (connectionError) {
        console.error('Database connection test failed:', connectionError.message);
        errors.push(`Database connection failed: ${connectionError.message}`);
      }

      // Verify tables exist and are accessible
      const tableCheck = await verifyTables();
      console.log('Table verification result:', tableCheck);
      
      // Initialize current week budget if tables are accessible
      if (tableCheck.weekly_budgets && tableCheck.budget_categories) {
        console.log('Tables verified, initializing current week budget...');
        try {
          await initializeCurrentWeek();
          console.log('✅ Current week budget initialized successfully.');
        } catch (initError) {
          console.error('Failed to initialize current week budget:', initError.message);
          warnings.push(`Current week initialization failed: ${initError.message}`);
        }
      } else {
        console.warn('Tables not accessible, skipping current week initialization');
        errors.push('Tables were not accessible - check database permissions and connection');
      }
      
      // Determine if setup was successful
      const setupSuccessful = tableCheck.weekly_budgets && tableCheck.budget_categories;
      
      res.status(setupSuccessful ? 200 : 500).json({
        success: setupSuccessful,
        message: setupSuccessful 
          ? 'Database setup verification completed successfully. All tables are accessible.'
          : 'Database setup verification failed. Some tables are not accessible.',
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
  const existingBudgets = await queryBuilder.getWeeklyBudgets(currentWeek);
  
  if (existingBudgets.length === 0) {
    // Create default budget for current week
    const defaultBudget = [
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
    
    for (const allocation of defaultBudget) {
      const budgetData = {
        week_date: currentWeek,
        category_id: allocation.categoryId,
        planned_amount: allocation.amount,
        action_plan: allocation.actionPlan,
        status: 'active'
      };
      await queryBuilder.insertWeeklyBudget(budgetData);
    }
  }
}

async function verifyTables() {
  try {
    const tables = ['budget_categories', 'weekly_budgets', 'expenses', 'budget_adjustments', 'savings_goals', 'weekly_summaries'];
    const results = {};
    
    for (const table of tables) {
      try {
        // Test each table by trying to read from it
        switch (table) {
          case 'budget_categories':
            await queryBuilder.getBudgetCategories();
            results[table] = true;
            break;
          case 'weekly_budgets':
            await queryBuilder.getWeeklyBudgets();
            results[table] = true;
            break;
          case 'expenses':
            await queryBuilder.getExpenses();
            results[table] = true;
            break;
          case 'budget_adjustments':
            await queryBuilder.getBudgetAdjustments();
            results[table] = true;
            break;
          case 'savings_goals':
            await queryBuilder.getSavingsGoals();
            results[table] = true;
            break;
          case 'weekly_summaries':
            // Test with a specific date
            const testDate = new Date().toISOString().split('T')[0];
            await queryBuilder.getWeeklySummary(testDate);
            results[table] = true;
            break;
          default:
            results[table] = false;
        }
        console.log(`Table ${table}: EXISTS`);
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
