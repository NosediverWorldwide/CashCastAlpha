import { useState } from 'react';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Box
} from '@mui/material';

function ExpenseForm({ onSubmit, isConnected, user }) {
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.token) {
      return;
    }
    
    if (!newExpense.description || !newExpense.amount || !newExpense.date || !newExpense.type) {
      return;
    }

    const success = await onSubmit({
      ...newExpense,
      amount: parseFloat(newExpense.amount)
    });

    if (success) {
      setNewExpense({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
      });
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}> 
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>Add New Item</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField 
              label="Description" 
              value={newExpense.description} 
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))} 
              fullWidth 
              required 
              disabled={!isConnected} 
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField 
              label="Amount" 
              type="number" 
              value={newExpense.amount} 
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))} 
              fullWidth 
              required 
              inputProps={{ min: 0, step: 0.01 }} 
              disabled={!isConnected} 
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField 
              label="Date" 
              type="date" 
              value={newExpense.date} 
              onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))} 
              fullWidth 
              required 
              InputLabelProps={{ shrink: true }} 
              disabled={!isConnected} 
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField 
              select 
              label="Type" 
              value={newExpense.type} 
              onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value }))} 
              fullWidth 
              required 
              disabled={!isConnected}
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display: 'flex' }}>
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              color="primary" 
              disabled={!isConnected}
              sx={{ height: '100%' }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export default ExpenseForm; 