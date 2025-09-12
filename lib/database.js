/**
 * Database connection utility for Vercel serverless functions
 * Uses PlanetScale or MySQL-compatible database
 */

const mysql = require('mysql2/promise');

let connection = null;

async function getConnection() {
  if (!connection) {
    try {
      // For Vercel, use environment variable for database URL
      const config = {
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      };

      // If DATABASE_URL is not available, use individual connection parameters
      if (!process.env.DATABASE_URL) {
        config.host = process.env.DB_HOST || 'localhost';
        config.user = process.env.DB_USER || 'root';
        config.password = process.env.DB_PASSWORD || '';
        config.database = process.env.DB_NAME || 'budget_planner';
        config.port = process.env.DB_PORT || 3306;
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
