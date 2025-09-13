/**
 * SQLite Database connection utility with singleton pattern
 * Uses better-sqlite3 for better performance
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Global singleton database instance with persistent storage
let db = null;
let isInitialized = false;

// Use a more persistent storage mechanism for Vercel dev environment
const getGlobalState = () => {
  if (typeof global !== 'undefined') {
    if (!global.__budgetPlannerDB) {
      global.__budgetPlannerDB = {
        db: null,
        isInitialized: false,
        statementCache: new Map()
      };
    }
    return global.__budgetPlannerDB;
  }
  return { db: null, isInitialized: false, statementCache: new Map() };
};

function getDatabase() {
  const globalState = getGlobalState();
  
  if (!globalState.db) {
    try {
      // For Render and other cloud platforms, use persistent storage
      // For local development, use data directory
      const isProduction = process.env.NODE_ENV === 'production';
      const isRender = process.env.RENDER === 'true';
      const dbDir = (isProduction && !isRender) ? '/tmp' : path.join(process.cwd(), 'data');
      
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize SQLite database with optimizations
      const dbPath = path.join(dbDir, 'budget_planner.db');
      globalState.db = new Database(dbPath, {
        // Performance optimizations
        verbose: null, // Disable verbose logging
        timeout: 5000  // 5 second timeout
      });

      // Enable performance optimizations
      globalState.db.pragma('foreign_keys = ON');
      globalState.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
      globalState.db.pragma('synchronous = NORMAL'); // Balance between safety and speed
      globalState.db.pragma('cache_size = -64000'); // 64MB cache
      globalState.db.pragma('temp_store = MEMORY'); // Store temp tables in memory

      // Initialize database schema only once
      if (!globalState.isInitialized) {
        initializeSchema(globalState.db);
        globalState.isInitialized = true;
        
        // Only log initialization if not in Vercel dev mode or if it's the first time
        const shouldLog = !process.env.VERCEL_ENV || !global.__budgetPlannerInitialized;
        if (shouldLog) {
          console.log(`SQLite database initialized: ${dbPath} (${isProduction ? 'production' : 'local'})`);
          global.__budgetPlannerInitialized = true;
        }
      }
    } catch (error) {
      console.error('SQLite database connection failed:', error);
      throw error;
    }
  }
  
  // Update local variables for backward compatibility
  db = globalState.db;
  isInitialized = globalState.isInitialized;
  
  return globalState.db;
}

function initializeSchema(database) {
  try {
    // Read and execute the SQLite schema
    const schemaPath = path.join(__dirname, 'database-schema-sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema at once
    database.exec(schema);

    // Only log schema loading once
    if (!global.__budgetPlannerSchemaLoaded) {
      console.log('Database schema loaded');
      global.__budgetPlannerSchemaLoaded = true;
    }
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}

async function query(sql, params = []) {
  try {
    const database = getDatabase();
    const globalState = getGlobalState();
    
    // Use cached prepared statement if available
    let stmt = globalState.statementCache.get(sql);
    if (!stmt) {
      stmt = database.prepare(sql);
      globalState.statementCache.set(sql, stmt);
    }
    
    // Handle different types of queries
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(params);
    } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const result = stmt.run(params);
      return { insertId: result.lastInsertRowid, affectedRows: result.changes };
    } else if (sql.trim().toUpperCase().startsWith('UPDATE') || 
               sql.trim().toUpperCase().startsWith('DELETE')) {
      const result = stmt.run(params);
      return { affectedRows: result.changes };
    } else {
      // For other queries (CREATE, DROP, etc.)
      database.exec(sql);
      return { success: true };
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function getConnection() {
  // For compatibility with existing code that expects a connection object
  return {
    execute: async (sql, params = []) => {
      const result = await query(sql, params);
      return [result, { affectedRows: result.affectedRows || 0, insertId: result.insertId }];
    },
    end: () => {
      // SQLite doesn't need connection closing like MySQL
      return Promise.resolve();
    }
  };
}

function closeConnection() {
  if (db) {
    db.close();
    db = null;
  }
}

// Handle process termination
process.on('SIGINT', () => {
  closeConnection();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeConnection();
  process.exit(0);
});

module.exports = {
  getConnection,
  query,
  closeConnection,
  getDatabase
};
