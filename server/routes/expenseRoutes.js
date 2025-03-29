const express = require('express');
const router = express.Router();

// Middleware to verify authentication
const authenticate = (db) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const session = await db.get('SELECT * FROM sessions WHERE token = ?', [token]);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.userId = session.user_id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

// Create function to initialize routes with the db
module.exports = function(db) {
  const auth = authenticate(db);
  
  // Get all expenses for the logged-in user
  router.get('/', auth, async (req, res) => {
    console.log(`GET /api/expenses`);
    try {
      const userId = req.userId;
      console.log(`Fetching expenses for user: ${userId}`);
      
      const expenses = await db.all('SELECT * FROM expenses WHERE user_id = ?', [userId]);
      console.log(`Fetched expenses: ${JSON.stringify(expenses, null, 2)}`);
      
      res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  });
  
  // Add a new expense
  router.post('/', auth, async (req, res) => {
    console.log(`POST /api/expenses`);
    try {
      const userId = req.userId;
      console.log(`Adding new item for user: ${userId}`);
      
      const { description, amount, date, type } = req.body;
      
      if (!description || amount === undefined || !date || !type) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      if (type !== 'expense' && type !== 'income') {
        return res.status(400).json({ error: 'Type must be either "expense" or "income"' });
      }
      
      const result = await db.run(
        'INSERT INTO expenses (user_id, description, amount, date, type) VALUES (?, ?, ?, ?, ?)',
        [userId, description, amount, date, type]
      );
      
      const newExpense = {
        id: result.lastID,
        user_id: userId,
        description,
        amount,
        date,
        type
      };
      
      console.log(`Successfully added item: ${JSON.stringify(newExpense, null, 2)}`);
      res.status(201).json(newExpense);
    } catch (error) {
      console.error('Error adding expense:', error);
      res.status(500).json({ error: 'Failed to add expense' });
    }
  });
  
  // Delete an expense
  router.delete('/:id', auth, async (req, res) => {
    console.log(`DELETE /api/expenses/${req.params.id}`);
    try {
      const userId = req.userId;
      const expenseId = req.params.id;
      
      // Check if the expense belongs to the user
      const expense = await db.get(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?', 
        [expenseId, userId]
      );
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found or not authorized' });
      }
      
      await db.run('DELETE FROM expenses WHERE id = ?', [expenseId]);
      
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  });
  
  // Update an expense
  router.put('/:id', auth, async (req, res) => {
    console.log(`PUT /api/expenses/${req.params.id}`);
    try {
      const userId = req.userId;
      const expenseId = req.params.id;
      const { description, amount, date, type } = req.body;
      
      if (!description || amount === undefined || !date || !type) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Check if the expense belongs to the user
      const expense = await db.get(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?', 
        [expenseId, userId]
      );
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found or not authorized' });
      }
      
      await db.run(
        'UPDATE expenses SET description = ?, amount = ?, date = ?, type = ? WHERE id = ?',
        [description, amount, date, type, expenseId]
      );
      
      const updatedExpense = {
        id: parseInt(expenseId),
        user_id: userId,
        description,
        amount,
        date,
        type
      };
      
      res.json(updatedExpense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  });
  
  return router;
}; 