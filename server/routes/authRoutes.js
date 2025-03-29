const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Create a function to initialize routes with the db
module.exports = function(db) {
  // Register a new user
  router.post('/register', async (req, res) => {
    console.log('POST /api/auth/register');
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Check if username already exists
      const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
      );
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: result.lastID, username },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );
      
      // Store session
      await db.run(
        'INSERT INTO sessions (user_id, token, created_at) VALUES (?, ?, datetime("now"))',
        [result.lastID, token]
      );
      
      res.status(201).json({ token, username });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error during registration' });
    }
  });
  
  // Login user
  router.post('/login', async (req, res) => {
    console.log('POST /api/auth/login');
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Find user
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );
      
      // Store session
      await db.run(
        'INSERT INTO sessions (user_id, token, created_at) VALUES (?, ?, datetime("now"))',
        [user.id, token]
      );
      
      res.json({ token, username });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });
  
  // Logout user
  router.post('/logout', async (req, res) => {
    console.log('POST /api/auth/logout');
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Remove session
      await db.run('DELETE FROM sessions WHERE token = ?', [token]);
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error during logout' });
    }
  });
  
  return router;
}; 