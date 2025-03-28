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

function App() {
  const { user, login, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    } else {
      setIsLoading(false);
      setExpenses([]);
    }
  }, [user]);

  const fetchExpenses = async () => {
    if (!user || !user.token) return;
    setIsLoading(true);
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
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Unable to connect or fetch data. Please check server and login.');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!user || !user.token) {
      setError('You must be logged in to add items.');
      return;
    }
    
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to add item' }));
        throw new Error(errorData.error || 'Failed to add item');
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
      setIsConnected(true);
    } catch (err) {
      setError(err.message || 'Error adding item');
      console.error('Error adding item:', err);
      setIsConnected(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user || !user.token) {
      setError('You must be logged in to delete items.');
      return;
    }
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

  const handleToggleForm = () => {
    setIsLoginView(!isLoginView);
    setError('');
  };

  const handleAuthSuccess = (token, username) => {
    login(token, username);
    setError('');
  };

  const totalIncome = expenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  const totalExpenses = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar 
          position="static" 
          sx={{ background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)' }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 1 }}>
              CashCast
            </Typography>
            {user ? (
              <Button color="inherit" onClick={logout} startIcon={<LogoutIcon/>}>
                Logout
              </Button>
            ) : (
              <Typography sx={{ color: 'inherit' }}>Please log in</Typography>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Dialog open={!user} fullWidth maxWidth="xs">
            <DialogContent>
              {isLoginView ? (
                <Login onToggleForm={handleToggleForm} onSuccess={handleAuthSuccess} />
              ) : (
                <Register onToggleForm={handleToggleForm} onSuccess={handleAuthSuccess} />
              )}
            </DialogContent>
          </Dialog>

          {user && (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {!isConnected && <Alert severity="warning" sx={{ mb: 2 }}>Server connection issue. Please ensure the backend is running.</Alert>}
              
              {isLoading ? (
                <Typography>Loading expenses...</Typography>
              ) : (
                <>
                  <Calendar expenses={expenses} />
                  
                  <Paper sx={{ p: 3, mb: 3, boxShadow: 3, transition: 'all 0.3s ease-in-out', '&:hover': { boxShadow: 6 } }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                      Add New Item
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <TextField label="Description" value={newExpense.description} onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))} fullWidth required placeholder="Enter item description" disabled={!isConnected} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField label="Amount" type="number" value={newExpense.amount} onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))} fullWidth required inputProps={{ min: 0, step: 0.01 }} placeholder="Enter amount" disabled={!isConnected} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField label="Date" type="date" value={newExpense.date} onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))} fullWidth required InputLabelProps={{ shrink: true }} disabled={!isConnected} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField select label="Type" value={newExpense.type} onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value }))} fullWidth required disabled={!isConnected}> 
                            <MenuItem value="expense">Expense</MenuItem>
                            <MenuItem value="income">Income</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Button type="submit" variant="contained" fullWidth color="primary" disabled={!isConnected}> Add </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>

                  <Paper sx={{ p: 3, boxShadow: 3, transition: 'all 0.3s ease-in-out', '&:hover': { boxShadow: 6 } }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                      Items
                    </Typography>
                    <List>
                      {expenses.map((expense) => (
                        <ListItem 
                          key={expense.id}
                          secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(expense.id)} disabled={!isConnected} sx={{ transition: 'all 0.2s ease-in-out', '&:hover': { color: 'error.main', transform: 'scale(1.1)' } }}>
                              <DeleteIcon />
                            </IconButton>
                          }
                          sx={{ borderBottom: '1px solid', borderColor: 'divider', transition: 'all 0.2s ease-in-out', '&:hover': { backgroundColor: 'action.hover' } }}
                        >
                          <ListItemText
                            primary={expense.description}
                            secondary={`Amount: $${(Number(expense.amount) || 0).toFixed(2)} - Date: ${expense.date}`}
                            primaryTypographyProps={{ fontWeight: 500 }}
                            secondaryTypographyProps={{
                              color: expense.type === 'income' ? 'success.dark' : 'error.dark',
                              fontWeight: 'bold'
                            }}
                          />
                        </ListItem>
                      ))}
                      {expenses.length === 0 && <ListItem><ListItemText primary="No items yet." /></ListItem>}
                    </List>
                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={2} justifyContent="center">
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1, textAlign: 'center', transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'scale(1.03)', boxShadow: 2 } }}>
                          <Typography variant="overline">Total Income</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${totalIncome.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1, textAlign: 'center', transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'scale(1.03)', boxShadow: 2 } }}>
                          <Typography variant="overline">Total Expenses</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${totalExpenses.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: netBalance >= 0 ? 'info.light' : 'warning.light', color: netBalance >= 0 ? 'info.contrastText' : 'warning.contrastText', borderRadius: 1, textAlign: 'center', transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'scale(1.03)', boxShadow: 2 } }}>
                          <Typography variant="overline">Net Balance</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${netBalance.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </>
              )}
            </>
          )}
        </Container>
      </Box>
    </LocalizationProvider>
  );
}

export default App;
