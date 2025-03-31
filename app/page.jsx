'use client'

import { useState, useEffect } from 'react';
import TransactionsNew from './components/TransactionsNew';
import Calendar from '../src/components/Calendar';
import { calculateAvailableToSpend } from '../src/components/CalendarUtils';
import { Paper, Typography, Box, Container, Grid, Stack } from '@mui/material';
import ExpenseForm from '../src/components/ExpenseForm';
import { format } from 'date-fns';

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [user, setUser] = useState({ token: 'demo-token' }); // Simplified user for demo
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger state

  // Function to refresh expenses data
  const refreshExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      console.log(`Fetched ${data.length} expenses`);
      
      // Clean the descriptions before setting them in state
      const cleanedExpenses = data.map(exp => ({
        ...exp,
        description: exp.description ? String(exp.description).replace(/0+$/, '') : exp.description
      }));
      
      setExpenses(cleanedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use effect for initial load and refreshes
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/expenses');
        if (!response.ok) throw new Error('Failed to fetch expenses');
        const data = await response.json();
        
        if (isMounted) {
          console.log(`Fetched ${data.length} expenses on refresh ${refreshTrigger}`);
          console.log('Transaction data received:', JSON.stringify(data, null, 2));
          
          // Debug log for the description field
          data.forEach(item => {
            console.log(`Front-end received expense: ID=${item.id}, Description="${item.description}", Type=${typeof item.description}`);
          });
          
          // Create a new expenses array with cleaned descriptions
          const cleanedExpenses = data.map(exp => ({
            ...exp,
            description: exp.description ? String(exp.description).replace(/0+$/, '') : exp.description
          }));
          
          setExpenses(cleanedExpenses);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]); // Trigger refresh when this state changes

  const handleAddExpense = async (newExpense) => {
    try {
      // Make sure we're passing all recurring transaction properties
      const expenseData = {
        ...newExpense,
        isRecurring: newExpense.isRecurring || false,
        recurringFrequency: newExpense.isRecurring ? newExpense.recurringFrequency : null
      };
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });

      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }

      // Instead of reloading the page, trigger a refresh of the expenses data
      await refreshExpenses();
      
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };

  const handleDeleteTransaction = async (transactionId, isRecurring) => {
    try {
      console.log(`Page: Attempting to delete transaction ${transactionId}, isRecurring: ${isRecurring}`);
      
      // If it's a recurring transaction, add the deleteAll query parameter
      const url = isRecurring 
        ? `/api/expenses/${transactionId}?deleteAll=true`
        : `/api/expenses/${transactionId}`;

      console.log(`Page: Sending DELETE request to ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Page: Delete response not OK:', errorData);
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      const responseData = await response.json();
      console.log('Page: Delete successful, server response:', responseData);
      
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

      // Also trigger a refresh to ensure sync with server
      await refreshExpenses();
      
      return true;
    } catch (error) {
      console.error('Page: Error deleting transaction:', error);
      return false;
    }
  };

  return (
    <div className="app-container">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', textAlign: 'center' }}>Cash Cast</h1>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  border: '2px solid #111',
                  borderRadius: 0,
                  boxShadow: '4px 4px 0px #111',
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Current Month
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Typography>
              </Paper>
              
              <ExpenseForm 
                onSubmit={handleAddExpense} 
              />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TransactionsNew 
              transactions={expenses}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
} 