/**
 * Database connection utility for Vercel serverless functions
 * Uses PlanetScale or MySQL-compatible database
 */

const mysql = require('mysql2/promise');

let connection = null;

async function getConnection() {
  if (!connection) {
    try {
      let config;

      // For Vercel, use environment variable for database URL
      if (process.env.DATABASE_URL) {
        config = {
          uri: process.env.DATABASE_URL,
          ssl: getSSLConfig()
        };
      } else {
        // If DATABASE_URL is not available, use individual connection parameters
        config = {
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'budget_planner',
          port: process.env.DB_PORT || 3306,
          ssl: getSSLConfig()
        };
      }

      connection = await mysql.createConnection(config);
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
  return connection;
}

function getSSLConfig() {
  // Check if we have a TiDB CA certificate
  if (process.env.TIDB_CA_CERT) {
    try {
      // Parse the CA certificate from environment variable
      const caCert = process.env.TIDB_CA_CERT;
      
      return {
        rejectUnauthorized: true,
        ca: caCert
      };
    } catch (error) {
      console.warn('Failed to parse TIDB_CA_CERT, falling back to rejectUnauthorized: false');
      return {
        rejectUnauthorized: false
      };
    }
  }
  
  // Default SSL configuration
  return {
    rejectUnauthorized: false
  };
}

async function query(sql, params = []) {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

module.exports = {
  getConnection,
  query,
  closeConnection
};
