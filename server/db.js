const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Initialize the database connection
async function initializeDatabase() {
  // Open the database
  const db = await open({
    filename: path.resolve(__dirname, '../expenses.db'),
    driver: sqlite3.Database
  });
  
  console.log('Connected to SQLite database');
  
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');
  
  // Create tables if they don't exist
  await createTables(db);
  
  return db;
}

// Create database tables
async function createTables(db) {
  // Create users table
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Users table ready');

  // Create sessions table
  await db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  console.log('Sessions table ready');

  // Recreate expenses table (for development purposes, in production we'd use migrations)
  await db.run('DROP TABLE IF EXISTS expenses');
  console.log('Dropped existing expenses table');

  await db.run(`
    CREATE TABLE expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  console.log('Expenses table ready');
  
  console.log('All tables initialized successfully');
}

module.exports = { initializeDatabase }; 