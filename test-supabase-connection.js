/**
 * Simple test script to verify Supabase connection and basic operations
 * Run this after setting up your Supabase project to test the connection
 */

require('dotenv').config();
const database = require('./lib/database');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    // Test 1: Check if Supabase environment variables are set
    const isUsingSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
    console.log(`Database type: Supabase (PostgreSQL)`);
    
    if (!isUsingSupabase) {
      console.log('❌ Supabase environment variables not found.');
      console.log('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
      console.log('The application now requires Supabase to run.');
      return;
    }

    // Test 2: Test basic connection
    console.log('📡 Testing basic connection...');
    const { queryBuilder } = database;
    
    if (!queryBuilder) {
      throw new Error('Supabase queryBuilder not available');
    }

    // Test 3: Test reading budget categories
    console.log('📋 Testing budget categories read...');
    const categories = await queryBuilder.getBudgetCategories();
    console.log(`✅ Found ${categories.length} budget categories`);
    
    if (categories.length > 0) {
      console.log('Sample category:', categories[0]);
    }

    // Test 4: Test reading weekly budgets
    console.log('📅 Testing weekly budgets read...');
    const weeklyBudgets = await queryBuilder.getWeeklyBudgets();
    console.log(`✅ Found ${weeklyBudgets.length} weekly budget entries`);

    // Test 5: Test reading expenses
    console.log('💰 Testing expenses read...');
    const expenses = await queryBuilder.getExpenses();
    console.log(`✅ Found ${expenses.length} expense entries`);

    // Test 6: Test reading savings goals
    console.log('🎯 Testing savings goals read...');
    const savingsGoals = await queryBuilder.getSavingsGoals();
    console.log(`✅ Found ${savingsGoals.length} savings goals`);

    // Test 7: Test reading weekly summaries
    console.log('📊 Testing weekly summaries read...');
    // Note: getWeeklySummary gets a single summary by week date, not all summaries
    // For testing, we'll try to get a summary for the current week
    const currentWeek = new Date().toISOString().split('T')[0];
    const summary = await queryBuilder.getWeeklySummary(currentWeek);
    console.log(`✅ Weekly summary test completed (${summary ? 'found' : 'none found'} for current week)`);

    console.log('🎉 All tests passed! Supabase connection is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('Missing Supabase environment variables')) {
      console.log('\n💡 To fix this:');
      console.log('1. Create a Supabase project at https://supabase.com');
      console.log('2. Get your Project URL and API keys from Settings → API');
      console.log('3. Add them to your .env file:');
      console.log('   SUPABASE_URL=https://your-project-ref.supabase.co');
      console.log('   SUPABASE_ANON_KEY=your-anon-key-here');
    } else if (error.message.includes('Failed to connect')) {
      console.log('\n💡 To fix this:');
      console.log('1. Check your SUPABASE_URL and SUPABASE_ANON_KEY');
      console.log('2. Make sure your Supabase project is active');
      console.log('3. Run the database schema: lib/database-schema-supabase.sql');
    }
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { testSupabaseConnection };
