import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Alert,
  Box,
  ThemeProvider,
  CssBaseline,
  Paper
} from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import custom components
import AppHeader from './components/AppHeader';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Calendar from './components/Calendar';
import LoginDialog from './components/LoginDialog';
import { calculateAvailableToSpend } from './components/CalendarUtils.jsx';
import TransactionsNew from '../app/components/TransactionsNew';

// Import theme
import theme from './theme';

function App() {
  const { user, login, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const handleAddExpense = async (newExpense) => {
    setError('');
    
    if (!user || !user.token) {
      setError('You must be logged in to add items.');
      return false;
    }
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(newExpense)
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
      setIsConnected(true);
      return true;
    } catch (err) {
      setError(err.message || 'Error adding item');
      console.error('Error adding item:', err);
      setIsConnected(false);
      return false;
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppHeader user={user} onLogout={logout} />

          <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <LoginDialog 
              isOpen={!user} 
              isLoginView={isLoginView} 
              onToggleForm={handleToggleForm} 
              onSuccess={handleAuthSuccess} 
            />

            {user && (
              <>
                {error && <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{error}</Alert>}
                {!isConnected && <Alert severity="warning" variant="filled" sx={{ mb: 2 }}>Server connection issue.</Alert>}
                
                {isLoading ? (
                  <Typography>Loading expenses...</Typography>
                ) : (
                  <>
                    {/* Available money to spend today section */}
                    <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', border: '2px solid #111' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'white' }}>
                          Available money to spend today
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                          ${calculateAvailableToSpend(new Date(), expenses).toFixed(2)}
                        </Typography>
                      </Box>
                    </Paper>

                    <Calendar 
                      expenses={expenses}
                      currentMonth={currentMonth}
                      onMonthChange={setCurrentMonth}
                    />
                    
                    <ExpenseForm 
                      onSubmit={handleAddExpense} 
                      isConnected={isConnected}
                      user={user}
                    />

                    <TransactionsNew 
                      transactions={expenses}
                      currentMonth={currentMonth}
                      onMonthChange={setCurrentMonth}
                      onDelete={handleDelete}
                    />
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

