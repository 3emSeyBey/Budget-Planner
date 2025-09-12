/**
 * Test SQL execution endpoint
 */

const { query } = require('../lib/database');

module.exports = async (req, res) => {
  console.log('Test SQL API called:', req.method, req.url);
  
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
    const results = {
      connection_test: null,
      database_selection: null,
      simple_create: null,
      simple_query: null,
      errors: []
    };

    // Test 1: Basic connection
    try {
      await query('SELECT 1 as test');
      results.connection_test = 'SUCCESS';
    } catch (error) {
      results.connection_test = 'FAILED';
      results.errors.push(`Connection test failed: ${error.message}`);
    }

    // Test 2: Database selection
    try {
      await query('USE test');
      const [dbResult] = await query('SELECT DATABASE() as current_db');
      results.database_selection = `SUCCESS - Using: ${dbResult[0]?.current_db}`;
    } catch (error) {
      results.database_selection = 'FAILED';
      results.errors.push(`Database selection failed: ${error.message}`);
    }

    // Test 3: Simple CREATE TABLE
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS test_sql_table (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.simple_create = 'SUCCESS';
    } catch (error) {
      results.simple_create = 'FAILED';
      results.errors.push(`CREATE TABLE failed: ${error.message}`);
    }

    // Test 4: Simple query
    try {
      const [rows] = await query('SELECT COUNT(*) as count FROM test_sql_table');
      results.simple_query = `SUCCESS - Count: ${rows[0].count}`;
    } catch (error) {
      results.simple_query = 'FAILED';
      results.errors.push(`Query failed: ${error.message}`);
    }

    // Clean up
    try {
      await query('DROP TABLE IF EXISTS test_sql_table');
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }

    res.status(200).json({
      success: true,
      message: 'SQL execution test completed',
      results: results
    });

  } catch (error) {
    console.error('Test SQL Error:', error);
    res.status(500).json({
      success: false,
      message: `Test failed: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
