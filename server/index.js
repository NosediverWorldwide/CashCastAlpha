const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

async function startServer() {
  // Initialize database
  const db = await initializeDatabase();
  
  // Initialize Express app
  const app = express();
  const port = process.env.PORT || 3002;
  
  // Middleware
  app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  
  // JSON parsing
  app.use(express.json());
  
  // Routes
  app.use('/api/auth', authRoutes(db));
  app.use('/api/expenses', expenseRoutes(db));
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  // Start server
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('Closing database connection...');
    await db.close();
    console.log('Server shutting down...');
    process.exit(0);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 