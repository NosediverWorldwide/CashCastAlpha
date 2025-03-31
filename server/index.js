const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your_jwt_secret_for_development';
  console.log('Using default JWT_SECRET for development');
}

async function startServer() {
  // Initialize database
  const db = await initializeDatabase();
  
  // Initialize Express app
  const app = express();
  const port = process.env.PORT || 3002;
  
  // Middleware
  app.use(cors({
    // Allow requests from any localhost origin during development
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
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