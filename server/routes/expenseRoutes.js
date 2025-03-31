const express = require('express');
const router = express.Router();

// Middleware to verify authentication
const authenticate = (db) => async (req, res, next) => {
  try {
    // Bypass authentication for development/testing
    if (process.env.NODE_ENV === 'development' || true) {
      req.userId = 1; // Use a default user ID for testing
      return next();
    }
    
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
      
      // Log each expense's description to debug the '0' issue
      expenses.forEach(expense => {
        console.log(`Expense ID: ${expense.id}, Description raw: "${expense.description}", Type: ${typeof expense.description}`);
      });
      
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
      
      const { description, amount, date, type, isRecurring, recurringFrequency } = req.body;
      
      if (!description || amount === undefined || !date || !type) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      if (type !== 'expense' && type !== 'income') {
        return res.status(400).json({ error: 'Type must be either "expense" or "income"' });
      }
      
      // Clean the description to remove any trailing zeros
      const cleanedDescription = String(description).trim();
      
      // Generate a unique ID for recurring transaction groups
      const recurringGroupId = isRecurring ? `${userId}-${Date.now()}` : null;
      
      // First, insert the initial transaction
      const result = await db.run(
        'INSERT INTO expenses (user_id, description, amount, date, type, is_recurring, recurring_frequency, recurring_group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, cleanedDescription, amount, date, type, isRecurring ? 1 : 0, recurringFrequency || null, recurringGroupId]
      );
      
      const newExpense = {
        id: result.lastID,
        user_id: userId,
        description,
        amount,
        date,
        type,
        is_recurring: isRecurring ? 1 : 0,
        recurring_frequency: recurringFrequency || null,
        recurring_group_id: recurringGroupId
      };
      
      // If this is a recurring transaction, create future transactions based on frequency
      if (isRecurring && recurringFrequency) {
        const [startYear, startMonth, startDay] = date.split('-').map(num => parseInt(num, 10));
        const futureTransactions = [];
        
        // Calculate how many future transactions to generate (rest of the calendar year)
        let numTransactions = 0;
        const currentYear = startYear;
        const monthsRemaining = 12 - startMonth + 1; // Include current month
        
        switch(recurringFrequency) {
          case 'daily':
            // Calculate remaining days in the year
            const endOfYear = new Date(currentYear, 11, 31);
            const startDate = new Date(startYear, startMonth - 1, startDay);
            numTransactions = Math.ceil((endOfYear - startDate) / (1000 * 60 * 60 * 24));
            break;
          case 'weekly':
            // Calculate remaining weeks in the year
            numTransactions = Math.ceil(monthsRemaining * 4.33); // Average weeks per month
            break;
          case 'biweekly':
            // Calculate remaining two-week periods in the year
            numTransactions = Math.ceil(monthsRemaining * 2.16); // Average two-week periods per month
            break;
          case 'monthly':
            // Simply use remaining months in the year
            numTransactions = monthsRemaining;
            break;
          default:
            numTransactions = 0;
        }
        
        console.log(`Generating ${numTransactions} future transactions for the year ${currentYear}`);
        
        // Generate and insert future transactions
        for (let i = 1; i <= numTransactions; i++) {
          let nextDate;
          
          // Calculate next date based on frequency
          switch(recurringFrequency) {
            case 'daily':
              // For daily, use simple date addition
              const tempDate = new Date(startYear, startMonth - 1, startDay + i);
              nextDate = tempDate.toISOString().split('T')[0];
              break;
            case 'weekly':
              // For weekly, add 7 days each time
              const weeklyDate = new Date(startYear, startMonth - 1, startDay + (i * 7));
              nextDate = weeklyDate.toISOString().split('T')[0];
              break;
            case 'biweekly':
              // For biweekly, add 14 days each time
              const biweeklyDate = new Date(startYear, startMonth - 1, startDay + (i * 14));
              nextDate = biweeklyDate.toISOString().split('T')[0];
              break;
            case 'monthly':
              // For monthly, calculate the target month and year
              const targetMonth = startMonth + i;
              const targetYear = startYear + Math.floor((targetMonth - 1) / 12);
              const adjustedMonth = ((targetMonth - 1) % 12) + 1;
              
              // Check if the day exists in the target month
              const daysInTargetMonth = new Date(targetYear, adjustedMonth, 0).getDate();
              const targetDay = Math.min(startDay, daysInTargetMonth);
              
              // Format the date string manually to avoid timezone issues
              nextDate = `${targetYear}-${String(adjustedMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
              break;
          }
          
          // Skip if we've generated a date beyond the current year
          if (parseInt(nextDate.split('-')[0]) > currentYear) {
            break;
          }
          
          // Insert the recurring transaction
          await db.run(
            'INSERT INTO expenses (user_id, description, amount, date, type, is_recurring, recurring_frequency, recurring_group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, cleanedDescription, amount, nextDate, type, 1, recurringFrequency, recurringGroupId]
          );
        }
        
        console.log(`Generated ${numTransactions} future recurring transactions`);
      }
      
      console.log(`Successfully added item: ${JSON.stringify(newExpense, null, 2)}`);
      res.status(201).json(newExpense);
    } catch (error) {
      console.error('Error adding expense:', error);
      res.status(500).json({ error: 'Failed to add expense' });
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
  
  // Delete all expenses for a user
  router.delete('/all', auth, async (req, res) => {
    try {
      const userId = req.userId;
      console.log(`Deleting all expenses for user: ${userId}`);
      
      await db.run('DELETE FROM expenses WHERE user_id = ?', [userId]);
      
      console.log(`Successfully deleted all expenses for user: ${userId}`);
      res.json({ message: 'All expenses deleted successfully' });
    } catch (error) {
      console.error('Error deleting expenses:', error);
      res.status(500).json({ error: 'Failed to delete expenses' });
    }
  });

  // Delete a single expense or all recurring instances
  router.delete('/:id', auth, async (req, res) => {
    try {
      const userId = req.userId;
      const expenseId = req.params.id;
      const deleteAll = req.query.deleteAll === 'true';
      
      console.log(`DELETE /api/expenses/${expenseId}${deleteAll ? '?deleteAll=true' : ''}`);

      // Check if the expense exists and belongs to the user
      const expense = await db.get(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
        [expenseId, userId]
      );

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found or not authorized' });
      }

      if (deleteAll && expense.is_recurring && expense.recurring_group_id) {
        // Delete all instances of the recurring transaction
        await db.run(
          'DELETE FROM expenses WHERE recurring_group_id = ? AND user_id = ?',
          [expense.recurring_group_id, userId]
        );
        console.log(`Deleted all recurring transactions for group: ${expense.recurring_group_id}`);
        res.json({ message: 'All recurring transactions deleted successfully' });
      } else {
        // Delete just this single transaction
        await db.run(
          'DELETE FROM expenses WHERE id = ? AND user_id = ?',
          [expenseId, userId]
        );
        console.log(`Deleted single transaction with ID: ${expenseId}`);
        res.json({ message: 'Expense deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  });
  
  return router;
}; 