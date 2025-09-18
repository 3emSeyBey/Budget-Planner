/**
 * Database connection utility
 * Uses Supabase (PostgreSQL) for all environments
 */

// Check for required Supabase environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required Supabase environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  console.error('   Please check your .env file and ensure Supabase is configured');
  process.exit(1);
}

// Only log once when module is first loaded
if (!global.databaseModuleLoaded) {
  console.log('✅ Using Supabase (PostgreSQL) database');
  global.databaseModuleLoaded = true;
}

// Import Supabase database module
const database = require('./database-supabase.js');

// Export the database functions
module.exports = {
  getConnection: database.getConnection,
  query: database.query,
  closeConnection: database.closeConnection,
  getSupabaseClient: database.getSupabaseClient,
  queryBuilder: database.queryBuilder
};