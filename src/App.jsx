import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Box,
  Divider,
  Alert,
  Snackbar,
  Grid,
  AppBar,
  Toolbar,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Calendar from './components/Calendar';
import { Fade } from '@mui/material';

function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched expenses:', data);
      const sortedExpenses = [...data].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      setExpenses(sortedExpenses);
      setIsConnected(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Unable to connect to server. Please make sure the server is running on port 3002.');
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newExpense.description || !newExpense.amount || !newExpense.date || !newExpense.type) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const addedItem = await response.json();
      setExpenses(prev => {
        const newExpenses = [...prev, addedItem];
        return newExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
      });
      setNewExpense({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
      });
    } catch (err) {
      setError('Error adding item');
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
      setIsConnected(true);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense. Please check your connection.');
      setIsConnected(false);
    }
  };

  const totalIncome = expenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalExpenses = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        flexGrow: 1,
        minHeight: '100vh',
        bgcolor: 'background.default',
        transition: 'all 0.3s ease-in-out'
      }}>
        <AppBar 
          position="static" 
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1CB5E0 90%)'
            }
          }}
        >
          <Toolbar>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 600,
                letterSpacing: 1
              }}
            >
              CashCast
            </Typography>
            {user ? (
              <Button 
                color="inherit" 
                onClick={logout}
                sx={{
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                Logout
              </Button>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => setShowLogin(true)}
                sx={{
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          {user ? (
            <>
              <Calendar expenses={expenses} />
              
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  boxShadow: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
              >
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: 3
                  }}
                >
                  Add New Item
                </Typography>
                <Box 
                  component="form" 
                  onSubmit={handleSubmit} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    '& .MuiTextField-root': {
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                        fullWidth
                        required
                        placeholder="Enter item description"
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
                        placeholder="Enter amount"
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
                    <Grid item xs={12} sm={2}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth
                        color="primary"
                        disabled={!isConnected}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              <Paper 
                sx={{ 
                  p: 3,
                  boxShadow: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
              >
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: 3
                  }}
                >
                  Transactions:
                </Typography>
                <List>
                  {expenses.map((expense) => (
                    <ListItem 
                      key={expense.id}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDelete(expense.id)}
                          disabled={!isConnected}
                          sx={{
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              color: 'error.main',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={expense.description}
                        secondary={`Amount: $${expense.amount.toFixed(2)} - Date: ${expense.date}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                        secondaryTypographyProps={{
                          color: expense.type === 'income' ? 'success.dark' : 'error.dark',
                          fontWeight: 'bold'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      backgroundColor: 'success.light',
                      color: 'white',
                      borderRadius: 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Typography variant="h6" component="div">
                      Total Income
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                      ${totalIncome.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box 
                    sx={{
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      backgroundColor: 'error.light',
                      color: 'white',
                      borderRadius: 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Typography variant="h6" component="div">
                      Total Expenses
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                      ${totalExpenses.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      backgroundColor: netBalance >= 0 ? 'success.main' : 'error.main',
                      color: 'white',
                      borderRadius: 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Typography variant="h6" component="div">
                      Net Balance
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                      ${netBalance.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </>
          ) : (
            <Paper 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                boxShadow: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  mb: 3
                }}
              >
                Welcome to CashCast
              </Typography>
              <Typography variant="body1" paragraph>
                Please login to manage your expenses and income.
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>

      {/* Login Dialog */}
      <Dialog 
        open={showLogin} 
        onClose={() => setShowLogin(false)}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 6
          }
        }}
      >
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          <Login onToggleForm={() => setShowLogin(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogin(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

function App() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <ExpenseTracker />;
}

export default App;
