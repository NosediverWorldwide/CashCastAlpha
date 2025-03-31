import { useState } from 'react';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Box,
  FormControlLabel,
  Checkbox,
  Collapse,
} from '@mui/material';

function ExpenseForm({ onSubmit, isConnected, user }) {
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    isRecurring: false,
    recurringFrequency: 'monthly',
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
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date,
      type: newExpense.type,
      isRecurring: newExpense.isRecurring,
      recurringFrequency: newExpense.isRecurring ? newExpense.recurringFrequency : null
    });

    if (success) {
      setNewExpense({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        isRecurring: false,
        recurringFrequency: 'monthly',
      });
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}> 
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>Add a New Transaction</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={2}>
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
          
          <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={!isConnected}
              sx={{ height: '56px', minWidth: '100%' }}
            >
              Add
            </Button>
          </Grid>
          
          {/* Recurring transaction options */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newExpense.isRecurring}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  disabled={!isConnected}
                />
              }
              label="This is a recurring transaction"
            />
            
            <Collapse in={newExpense.isRecurring}>
              <Box sx={{ pl: 3, pt: 1 }}>
                <TextField
                  select
                  label="Frequency"
                  value={newExpense.recurringFrequency}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                  fullWidth
                  disabled={!isConnected}
                  sx={{ maxWidth: 300 }}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="biweekly">Bi-weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </TextField>
              </Box>
            </Collapse>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export default ExpenseForm; 