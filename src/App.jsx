import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Alert,
  Box,
  ThemeProvider,
  CssBaseline,
  Paper,
  Button
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

  const handleToggleForm = () => {
    setIsLoginView(!isLoginView);
    setError('');
  };

  const handleAuthSuccess = (token, username) => {
    login(token, username);
    setError('');
  };

  const handleDeleteTransaction = async (transactionId, isRecurring) => {
    try {
      console.log(`App: Attempting to delete transaction ${transactionId}, isRecurring: ${isRecurring}`);
      
      // If it's a recurring transaction, add the deleteAll query parameter
      const url = isRecurring 
        ? `/api/expenses/${transactionId}?deleteAll=true`
        : `/api/expenses/${transactionId}`;

      console.log(`App: Sending DELETE request to ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('App: Delete response not OK:', errorData);
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      const responseData = await response.json();
      console.log('App: Delete successful, server response:', responseData);
      
      // Immediately update the local state
      if (isRecurring) {
        // For recurring transactions, remove all transactions with the same recurring_group_id
        const targetTransaction = expenses.find(exp => exp.id === transactionId);
        if (targetTransaction?.recurring_group_id) {
          setExpenses(prevExpenses => 
            prevExpenses.filter(exp => exp.recurring_group_id !== targetTransaction.recurring_group_id)
          );
        }
      } else {
        // For single transactions, just remove the one with matching ID
        setExpenses(prevExpenses => 
          prevExpenses.filter(exp => exp.id !== transactionId)
        );
      }

      // Also trigger a fetch to ensure sync with server
      await fetchExpenses();
      
      return true;
    } catch (error) {
      console.error('App: Error deleting transaction:', error);
      setError('Failed to delete transaction');
      return false;
    }
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
                      onDeleteTransaction={handleDeleteTransaction}
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

