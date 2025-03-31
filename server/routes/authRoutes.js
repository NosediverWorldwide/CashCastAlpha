const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const router = express.Router();

// Create a function to initialize routes with the db
module.exports = function(db) {
  // Register a new user
  router.post('/register', async (req, res) => {
    console.log('POST /api/auth/register');
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log('Missing username or password for registration');
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      if (username.length < 3) {
        console.log('Username too short');
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }
      
      if (password.length < 6) {
        console.log('Password too short');
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      
      console.log(`Attempting to register new user: ${username}`);
      
      // Check if user already exists
      const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (existingUser) {
        console.log(`Username already in use: ${username}`);
        return res.status(409).json({ error: 'Username already in use' });
      }
      
      console.log(`Creating new user: ${username}`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert the new user
      const result = await db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
      );
      
      if (!result || !result.lastID) {
        console.error('Failed to insert new user record');
        return res.status(500).json({ error: 'Failed to create user account' });
      }
      
      console.log(`User created with ID: ${result.lastID}`);
      
      // Generate a token 
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_for_development';
      console.log('Using JWT secret:', jwtSecret ? 'Secret is set' : 'SECRET NOT SET');
      
      const token = jwt.sign(
        { userId: result.lastID }, 
        jwtSecret,
        { expiresIn: '24h' }
      );
      
      // Create a session
      const sessionId = uuid.v4();
      await db.run(
        'INSERT INTO sessions (user_id, session_id) VALUES (?, ?)',
        [result.lastID, sessionId]
      );
      
      console.log(`Registration successful for user: ${username}`);
      
      res.status(201).json({ 
        userId: result.lastID,
        username,
        token,
        sessionId
      });
    } catch (error) {
      console.error('Error in register:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Login user
  router.post('/login', async (req, res) => {
    console.log('POST /api/auth/login');
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      console.log(`Attempting login for username: ${username}`);
      
      // Check if user exists
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) {
        console.log(`User not found: ${username}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log(`User found, verifying password`);
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log(`Invalid password for user: ${username}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log(`Password verified, generating token`);
      
      // Generate a token
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_for_development';
      console.log('Using JWT secret for login:', jwtSecret ? 'Secret is set' : 'SECRET NOT SET');
      
      const token = jwt.sign(
        { userId: user.id },
        jwtSecret,
        { expiresIn: '24h' }
      );
      
      // Create a session
      const sessionId = uuid.v4();
      await db.run(
        'INSERT INTO sessions (user_id, session_id) VALUES (?, ?)',
        [user.id, sessionId]
      );
      
      console.log(`Login successful for user: ${username}`);
      
      res.json({ 
        userId: user.id,
        username: user.username,
        token,
        sessionId
      });
    } catch (error) {
      console.error('Error in login:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Internal server error' });
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
      await db.run('DELETE FROM sessions WHERE session_id = ?', [token]);
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error during logout' });
    }
  });
  
  return router;
}; 