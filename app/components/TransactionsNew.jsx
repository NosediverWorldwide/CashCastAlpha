import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Box, Typography, IconButton, Paper, List, ListItem, ListItemText, Stack, useTheme, useMediaQuery, Fade } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import RepeatIcon from '@mui/icons-material/Repeat';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';

function TransactionsNew({ transactions, currentMonth, onMonthChange, onDeleteTransaction }) {
  const [localCurrentMonth, setLocalCurrentMonth] = useState(currentMonth || new Date());
  const [show, setShow] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Create sanitized local copy of transactions
  const sanitizedTransactions = React.useMemo(() => {
    return transactions?.map(transaction => {
      return {
        ...transaction
      };
    }) || [];
  }, [transactions]);
  
  // Sync with external currentMonth if provided
  useEffect(() => {
    if (currentMonth) {
      setLocalCurrentMonth(currentMonth);
    }
  }, [currentMonth]);

  // Add effect to handle transactions updates with debounce
  useEffect(() => {
    setShow(false);
    const timer = setTimeout(() => {
      setShow(true);
      // Force a re-render of filtered transactions
      setLocalCurrentMonth(prev => new Date(prev));
    }, 100);
    return () => clearTimeout(timer);
  }, [sanitizedTransactions]);

  // Helper function to safely parse dates and handle timezone issues
  const safeParseDate = (dateString) => {
    try {
      // Split the date string and reconstruct to ensure no timezone shifts
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      // Create a UTC date at noon to avoid timezone issues
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    } catch (error) {
      console.error("Error parsing date:", error, dateString);
      return new Date();
    }
  };

  // Filter transactions for the current month with improved date handling
  const filteredTransactions = sanitizedTransactions?.filter(transaction => {
    if (!transaction?.date) return false;
    
    const transactionDate = safeParseDate(transaction.date);
    const monthStart = new Date(Date.UTC(
      localCurrentMonth.getFullYear(),
      localCurrentMonth.getMonth(),
      1,
      12, 0, 0, 0
    ));
    const monthEnd = new Date(Date.UTC(
      localCurrentMonth.getFullYear(),
      localCurrentMonth.getMonth() + 1,
      0,
      12, 0, 0, 0
    ));
    
    try {
      return isWithinInterval(transactionDate, {
        start: monthStart,
        end: monthEnd
      });
    } catch (error) {
      console.error("Error filtering transaction:", error, transaction);
      return false;
    }
  })?.sort((a, b) => {
    const dateA = safeParseDate(a.date);
    const dateB = safeParseDate(b.date);
    return dateA.getTime() - dateB.getTime();
  }) || [];
  
  const goToPreviousMonth = () => {
    const newDate = subMonths(localCurrentMonth, 1);
    setLocalCurrentMonth(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };
  
  const goToNextMonth = () => {
    const newDate = addMonths(localCurrentMonth, 1);
    setLocalCurrentMonth(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const handleDelete = async (transactionId, isRecurring) => {
    console.log(`TransactionsNew: Deleting transaction ${transactionId}, isRecurring: ${isRecurring}`);
    try {
      const success = await onDeleteTransaction(transactionId, isRecurring);
      if (success) {
        console.log('TransactionsNew: Delete successful');
      } else {
        console.error('TransactionsNew: Delete failed');
      }
    } catch (error) {
      console.error('TransactionsNew: Error during delete:', error);
    }
  };
  
  return (
    <Fade in={show} timeout={300}>
      <Paper sx={{ p: 3 }}>
        {isMobile ? (
          // Mobile layout - stack vertically
          <Stack spacing={1} mb={2}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.25rem', sm: '1.5rem' } 
              }}
            >
              Transactions
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconButton 
                onClick={goToPreviousMonth} 
                className="month-nav-button"
                size="small"
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  mx: 1
                }}
              >
                {format(localCurrentMonth, 'MMMM yyyy')}
              </Typography>
              <IconButton 
                onClick={goToNextMonth} 
                className="month-nav-button"
                size="small"
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>
          </Stack>
        ) : (
          // Desktop layout - side by side
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Transactions
            </Typography>
            <Box className="transactions-header">
              <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={goToPreviousMonth} className="month-nav-button">
                  <ArrowBackIosNewIcon />
                </IconButton>
                {format(localCurrentMonth, 'MMMM yyyy')}
                <IconButton onClick={goToNextMonth} className="month-nav-button">
                  <ArrowForwardIosIcon />
                </IconButton>
              </Typography>
            </Box>
          </Stack>
        )}
        
        <List sx={{ p: 0 }}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => {
              return (
                <ListItem 
                  key={transaction.id} 
                  divider
                  sx={{
                    '&:hover .delete-icon': {
                      opacity: 1,
                    }
                  }}
                >
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography 
                          component="span"
                          noWrap 
                          sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            maxWidth: { xs: '160px', sm: '100%' },
                            mr: 1
                          }}
                        >
                          {transaction.description}
                        </Typography>
                        {transaction.is_recurring ? (
                          <RepeatIcon 
                            fontSize="small" 
                            color="primary" 
                            sx={{ fontSize: '1rem' }} 
                          />
                        ) : (
                          <EventIcon 
                            fontSize="small" 
                            color="action" 
                            sx={{ fontSize: '1rem', opacity: 0.6 }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        {format(safeParseDate(transaction.date), 'MMM d, yyyy')}
                        {transaction.is_recurring && transaction.recurring_frequency && (
                          <Typography component="span" variant="caption" sx={{ ml: 1, fontStyle: 'italic' }}>
                            • {transaction.recurring_frequency.charAt(0).toUpperCase() + transaction.recurring_frequency.slice(1)}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        color: transaction.type === 'income' ? 'success.main' : 'error.main',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${Math.abs(parseFloat(transaction.amount || 0)).toFixed(2)}
                    </Typography>
                    <IconButton
                      className="delete-icon"
                      onClick={() => handleDelete(transaction.id, transaction.is_recurring === 1)}
                      size="small"
                      sx={{
                        opacity: 0,
                        transition: 'all 0.2s ease-in-out',
                        color: 'grey.500',
                        '&:hover': {
                          color: 'error.main',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })
          ) : (
            <ListItem>
              <ListItemText primary="No transactions for this month" />
            </ListItem>
          )}
        </List>
      </Paper>
    </Fade>
  );
}

export default TransactionsNew; 