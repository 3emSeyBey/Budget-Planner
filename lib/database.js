/**
 * Database connection utility
 * Uses SQLite for both local development and production
 */

// Always use SQLite for simplicity and reliability
// Only log once when module is first loaded
if (!global.databaseModuleLoaded) {
  console.log('Using SQLite database for all environments');
  global.databaseModuleLoaded = true;
}

const database = require('./database-sqlite.js');

// Export the database functions
module.exports = {
  getConnection: database.getConnection,
  query: database.query,
  closeConnection: database.closeConnection
};