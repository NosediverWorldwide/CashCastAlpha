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
  InputLabel,
  createTheme,
  ThemeProvider,
  CssBaseline
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

// Define a Neo-Brutalist theme subset
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#111111' },
    success: { main: '#4caf50' }, 
    error: { main: '#f44336' },
    info: { main: '#2196f3' },
    warning: { main: '#ff9800' },
  },
  typography: {
    fontFamily: '"Inter", system-ui, Avenir, Helvetica, Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 'bold' }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '2px solid #111',
          borderRadius: 0,
          boxShadow: '4px 4px 0px #111',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '2px solid #111',
          boxShadow: '2px 2px 0px #111',
          transition: 'transform 0.1s ease-in-out, boxShadow 0.1s ease-in-out',
          '&:hover': {
            transform: 'translate(-1px, -1px)',
            boxShadow: '3px 3px 0px #111',
          },
          '&:active': {
            transform: 'translate(1px, 1px)',
            boxShadow: '1px 1px 0px #111',
          }
        },
        containedPrimary: { backgroundColor: '#1976d2', color: '#fff', '&:hover': { backgroundColor: '#1565c0' } },
        containedSecondary: { backgroundColor: '#dc004e', color: '#fff', '&:hover': { backgroundColor: '#9a0036' } }
      }
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    borderWidth: '2px',
                    borderColor: '#111',
                    '& fieldset': { border: '2px solid #111' },
                     '&:hover fieldset': { borderColor: '#111' },
                    '&.Mui-focused fieldset': { borderColor: '#111', borderWidth: '2px' },
                },
            }
        }
    },
    MuiListItem: {
        styleOverrides: {
            root: {
                borderBottom: '2px solid #111',
                borderRadius: 0,
                paddingTop: '12px',
                paddingBottom: '12px',
                transition: 'none',
                 '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
            }
        }
    },
    MuiAppBar: {
        styleOverrides: {
            root: { background: '#fff', color: '#111', borderBottom: '2px solid #111', boxShadow: 'none', position: 'static' }
        }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { border: '2px solid #111', borderRadius: 0, boxShadow: '4px 4px 0px #111' }
      }
    },
    MuiAlert: { // Style Alerts
      styleOverrides: {
        root: { borderRadius: 0, border: '2px solid #111' },
        filled: { border: '2px solid #111' } // Ensure filled alerts also have border
      }
    },
    MuiDivider: { // Style Dividers
      styleOverrides: {
        root: { borderBottomWidth: '2px', borderColor: '#111' }
      }
    }
  }
});

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

  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>CashCast</Typography>
              {user ? (
                <Button color="inherit" variant="outlined" onClick={logout} startIcon={<LogoutIcon/>}>Logout</Button>
              ) : (
                <Typography sx={{ fontWeight: 'bold' }}>Please log in</Typography>
              )}
            </Toolbar>
          </AppBar>

          <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Dialog open={!user} fullWidth maxWidth="xs" PaperProps={{ elevation: 0 }}>
              <DialogContent sx={{ border: 'none', boxShadow: 'none'}}>
                {isLoginView ? (
                  <Login onToggleForm={handleToggleForm} onSuccess={handleAuthSuccess} />
                ) : (
                  <Register onToggleForm={handleToggleForm} onSuccess={handleAuthSuccess} />
                )}
              </DialogContent>
            </Dialog>

            {user && (
              <>
                {error && <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{error}</Alert>}
                {!isConnected && <Alert severity="warning" variant="filled" sx={{ mb: 2 }}>Server connection issue.</Alert>}
                
                {isLoading ? (
                  <Typography>Loading expenses...</Typography>
                ) : (
                  <>
                    <Calendar expenses={expenses} />
                    
                    <Paper sx={{ p: 3, mb: 3 }}> 
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>Add New Item</Typography>
                      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}><TextField label="Description" value={newExpense.description} onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))} fullWidth required disabled={!isConnected} /></Grid>
                          <Grid item xs={12} sm={2}><TextField label="Amount" type="number" value={newExpense.amount} onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))} fullWidth required inputProps={{ min: 0, step: 0.01 }} disabled={!isConnected} /></Grid>
                          <Grid item xs={12} sm={2}><TextField label="Date" type="date" value={newExpense.date} onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))} fullWidth required InputLabelProps={{ shrink: true }} disabled={!isConnected} /></Grid>
                          <Grid item xs={12} sm={3}>
                              <TextField select label="Type" value={newExpense.type} onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value }))} fullWidth required disabled={!isConnected}>
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

                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>Transactions:</Typography>
                      <List sx={{ p: 0 }}> 
                        {expenses.map((expense) => (
                          <ListItem 
                            key={expense.id} 
                            disablePadding  
                            secondaryAction={
                              <IconButton 
                                edge="end" 
                                aria-label="delete" 
                                onClick={() => handleDelete(expense.id)} 
                                disabled={!isConnected} 
                                sx={{ 
                                  mr: 1,
                                  transition: 'color 0.2s',
                                  '&:hover': {
                                    color: '#f44336' // Red color on hover
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText 
                              sx={{ pl: 2 }}
                              primary={expense.description}
                              secondary={
                                <>
                                  <Box component="span" sx={{ color: expense.type === 'income' ? theme.palette.success.main : theme.palette.error.main, fontWeight: 'bold' }}>
                                    ${(Number(expense.amount) || 0).toFixed(2)}
                                  </Box>
                                  <Box component="span" sx={{ color: '#b8b8b8', ml: 1 }}>
                                    {expense.date}
                                  </Box>
                                </>
                              }
                              primaryTypographyProps={{ fontWeight: 'bold' }}
                            />
                          </ListItem>
                        ))}
                        {expenses.length === 0 && (
                          <ListItem disablePadding>
                            <ListItemText sx={{ pl: 2 }} primary="No transactions yet." />
                          </ListItem>
                        )}
                      </List>
                      <Divider sx={{ my: 3 }} />

                      <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, border: '2px solid #111', bgcolor: theme.palette.success.main, color: '#fff', textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ fontWeight: 'bold' }}>Total Income</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${totalIncome.toFixed(2)}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, border: '2px solid #111', bgcolor: theme.palette.error.main, color: '#fff', textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ fontWeight: 'bold' }}>Total Expenses</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${totalExpenses.toFixed(2)}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, border: '2px solid #111', bgcolor: netBalance >= 0 ? theme.palette.info.main : theme.palette.warning.main, color: '#fff', textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ fontWeight: 'bold' }}>Net Balance</Typography>
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
    </ThemeProvider>
  );
}

export default App;

