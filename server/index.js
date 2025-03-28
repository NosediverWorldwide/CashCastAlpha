import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3002;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add error handling for JSON parsing
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('JSON parsing error:', e);
      res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  }
}));

// Add response headers middleware
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Verify session token from database
  db.get('SELECT * FROM sessions WHERE token = ?', [token], (err, session) => {
    if (err) {
      console.error('Error checking session:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    if (sessionAge > 24 * 60 * 60 * 1000) {
      db.run('DELETE FROM sessions WHERE token = ?', [token]);
      return res.status(401).json({ error: 'Session expired' });
    }

    req.user = { id: session.user_id, username: session.username };
    next();
  });
};

// Database setup
let db;
try {
  db = new sqlite3.Database('expenses.db', (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    }
    console.log('Connected to SQLite database');
    
    // Create tables in sequence
    const createTables = () => {
      return new Promise((resolve, reject) => {
        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        )`, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
          } else {
            console.log('Users table ready');
            
            // Create sessions table
            db.run(`CREATE TABLE IF NOT EXISTS sessions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              token TEXT UNIQUE NOT NULL,
              user_id INTEGER NOT NULL,
              username TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )`, (err) => {
              if (err) {
                console.error('Error creating sessions table:', err);
                reject(err);
              } else {
                console.log('Sessions table ready');
                
                // Drop existing expenses table if it exists
                db.run('DROP TABLE IF EXISTS expenses', (err) => {
                  if (err) {
                    console.error('Error dropping expenses table:', err);
                    reject(err);
                  } else {
                    console.log('Dropped existing expenses table');
                    
                    // Create expenses table with user_id
                    db.run(`CREATE TABLE expenses (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER NOT NULL,
                      description TEXT NOT NULL,
                      amount REAL NOT NULL,
                      date DATE NOT NULL,
                      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                      FOREIGN KEY (user_id) REFERENCES users(id)
                    )`, (err) => {
                      if (err) {
                        console.error('Error creating expenses table:', err);
                        reject(err);
                      } else {
                        console.log('Expenses table ready');
                        resolve();
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
    };

    // Initialize tables
    createTables()
      .then(() => {
        console.log('All tables initialized successfully');
      })
      .catch((err) => {
        console.error('Error initializing tables:', err);
        process.exit(1);
      });
  });
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  console.log('Registration request received:', { username: req.body.username });
  const { username, password } = req.body;

  if (!username || !password) {
    console.log('Missing credentials');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Use a Promise to handle the database operations
    const createUser = () => {
      return new Promise((resolve, reject) => {
        console.log('Creating user in database...');
        db.run(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [username, hashedPassword],
          function(err) {
            if (err) {
              console.error('Database error creating user:', err);
              if (err.message.includes('UNIQUE constraint failed')) {
                reject({ status: 400, message: 'Username already exists' });
              } else {
                reject({ status: 500, message: 'Error creating user account' });
              }
            } else {
              console.log('User created successfully with ID:', this.lastID);
              resolve(this.lastID);
            }
          }
        );
      });
    };

    const createSession = (userId) => {
      return new Promise((resolve, reject) => {
        console.log('Creating session...');
        const token = uuidv4();
        db.run(
          'INSERT INTO sessions (token, user_id, username) VALUES (?, ?, ?)',
          [token, userId, username],
          (err) => {
            if (err) {
              console.error('Database error creating session:', err);
              reject({ status: 500, message: 'Error creating session' });
            } else {
              console.log('Session created successfully');
              resolve({ token, username });
            }
          }
        );
      });
    };

    // Execute the operations in sequence
    console.log('Starting registration process...');
    const userId = await createUser();
    const sessionData = await createSession(userId);

    const response = {
      message: 'User created successfully',
      ...sessionData
    };
    console.log('Sending response:', response);
    
    res.status(201).json(response);

  } catch (error) {
    console.error('Registration error:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    console.log('Sending error response:', { status, message });
    
    res.status(status).json({ error: message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Use Promise to handle the database operations
  const findUser = () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
          reject({ status: 500, message: 'Error finding user' });
        } else if (!user) {
          reject({ status: 401, message: 'Invalid credentials' });
        } else {
          resolve(user);
        }
      });
    });
  };

  const createSession = (user) => {
    return new Promise((resolve, reject) => {
      const token = uuidv4();
      db.run(
        'INSERT INTO sessions (token, user_id, username) VALUES (?, ?, ?)',
        [token, user.id, user.username],
        (err) => {
          if (err) {
            reject({ status: 500, message: 'Error creating session' });
          } else {
            resolve({ token, username: user.username });
          }
        }
      );
    });
  };

  // Execute the operations in sequence
  findUser()
    .then(async (user) => {
      try {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const sessionData = await createSession(user);
        res.json(sessionData);
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Error during login' });
      }
    })
    .catch((error) => {
      console.error('Login error:', error);
      res.status(error.status || 500).json({ error: error.message });
    });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  
  db.run('DELETE FROM sessions WHERE token = ?', [token], (err) => {
    if (err) {
      console.error('Error deleting session:', err);
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Protected API endpoints
app.get('/api/expenses', authenticateToken, (req, res) => {
  console.log('Fetching expenses for user:', req.user.id);
  db.all('SELECT * FROM expenses WHERE user_id = ? ORDER BY date ASC', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Error fetching expenses:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Fetched expenses:', rows);
    res.json(rows);
  });
});

app.post('/api/expenses', async (req, res) => {
  const { description, amount, date, type } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
  }

  try {
    const session = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM sessions WHERE token = ?', [token], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('Adding new item for user:', session.user_id);
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO expenses (user_id, description, amount, date, type) VALUES (?, ?, ?, ?, ?)',
        [session.user_id, description, amount, date, type],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    const newItem = {
      id: result,
      user_id: session.user_id,
      description,
      amount,
      date,
      type
    };

    console.log('Successfully added item:', newItem);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Error adding item' });
  }
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  console.log('Deleting expense with id:', id, 'for user:', req.user.id);

  db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id], (err) => {
    if (err) {
      console.error('Error deleting expense:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Successfully deleted expense with id:', id);
    res.json({ message: 'Expense deleted successfully' });
  });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Add a catch-all error handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
}); 