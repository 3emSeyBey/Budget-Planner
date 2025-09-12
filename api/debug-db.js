/**
 * Debug database connection and table creation
 */

const { query, getConnection } = require('../lib/database');

module.exports = async (req, res) => {
  console.log('Debug DB API called:', req.method, req.url);
  
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
    const debugInfo = {
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      },
      connection: null,
      databases: null,
      tables: null,
      errors: []
    };

    // Test connection
    try {
      const conn = await getConnection();
      debugInfo.connection = 'SUCCESS';
      
      // Get current database
      const [dbResult] = await conn.execute('SELECT DATABASE() as current_db');
      debugInfo.current_database = dbResult[0]?.current_db || 'UNKNOWN';
      
      // List all databases
      const [dbs] = await conn.execute('SHOW DATABASES');
      debugInfo.databases = dbs.map(db => db.Database);
      
      // List tables in current database
      try {
        const [tables] = await conn.execute('SHOW TABLES');
        debugInfo.tables = tables.map(table => Object.values(table)[0]);
      } catch (tableError) {
        debugInfo.table_error = tableError.message;
      }
      
    } catch (connError) {
      debugInfo.connection = 'FAILED';
      debugInfo.errors.push(connError.message);
    }

    // Test a simple CREATE TABLE command
    try {
      console.log('Testing CREATE TABLE command...');
      await query(`
        CREATE TABLE IF NOT EXISTS test_table_debug (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      debugInfo.create_table_test = 'SUCCESS';
      
      // Verify table was created
      const [testTables] = await query("SHOW TABLES LIKE 'test_table_debug'");
      debugInfo.test_table_exists = testTables.length > 0;
      
      // Clean up test table
      await query('DROP TABLE IF EXISTS test_table_debug');
      debugInfo.cleanup = 'SUCCESS';
      
    } catch (createError) {
      debugInfo.create_table_test = 'FAILED';
      debugInfo.errors.push(`CREATE TABLE test failed: ${createError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Database debug information',
      debug: debugInfo
    });

  } catch (error) {
    console.error('Debug DB Error:', error);
    res.status(500).json({
      success: false,
      message: `Debug failed: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
