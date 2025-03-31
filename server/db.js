const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Initialize the database connection
async function initializeDatabase() {
  try {
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
    
    // Add wrapper methods with error handling
    const originalGet = db.get;
    db.get = async function(...args) {
      try {
        return await originalGet.apply(this, args);
      } catch (error) {
        console.error(`Database get error with query: ${args[0]}`, error);
        throw error;
      }
    };
    
    const originalRun = db.run;
    db.run = async function(...args) {
      try {
        return await originalRun.apply(this, args);
      } catch (error) {
        console.error(`Database run error with query: ${args[0]}`, error);
        throw error;
      }
    };
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Create database tables
async function createTables(db) {
  try {
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
    
    // Create index for username if it doesn't exist
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_username 
      ON users(username)
    `);
    console.log('Username index ready');

    // Create sessions table
    await db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('Sessions table ready');
    
    // Create index for session_id if it doesn't exist
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_session_id 
      ON sessions(session_id)
    `);
    console.log('Session ID index ready');

    // Recreate expenses table (for development purposes, in production we'd use migrations)
    // This ensures a clean slate and removes old recurring columns on server restart.
    await db.exec(`
      DROP TABLE IF EXISTS expenses;
      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL, 
        type TEXT NOT NULL, 
        is_recurring BOOLEAN DEFAULT 0,
        recurring_frequency TEXT,
        recurring_group_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);
    console.log('Expenses table ready with recurring fields');
    
    console.log('All tables initialized successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

module.exports = { initializeDatabase }; 