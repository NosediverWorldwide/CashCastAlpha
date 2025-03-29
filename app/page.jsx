'use client'

import { useState, useEffect } from 'react';
import TransactionsNew from './components/TransactionsNew';
import Calendar from '../src/components/Calendar';
import { calculateAvailableToSpend } from '../src/components/CalendarUtils';
import { Paper, Typography, Box } from '@mui/material';

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch('/api/expenses');
        if (!response.ok) throw new Error('Failed to fetch expenses');
        const data = await response.json();
        setExpenses(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }
      
      // Update local state to remove the deleted transaction
      setExpenses(expenses.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {isLoading ? (
        <Typography>Loading...</Typography>
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
          
          {/* Calendar component */}
          <Calendar 
            expenses={expenses} 
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
          
          {/* Transactions component with month filtering */}
          <TransactionsNew 
            transactions={expenses} 
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDelete={handleDelete}
          />
        </>
      )}
    </main>
  );
} 