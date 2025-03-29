import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Box, Typography, IconButton, Paper, List, ListItem, ListItemText, Stack, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteIcon from '@mui/icons-material/Delete';

function TransactionsNew({ transactions, currentMonth, onMonthChange, onDelete }) {
  const [localCurrentMonth, setLocalCurrentMonth] = useState(currentMonth || new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Sync with external currentMonth if provided
  useEffect(() => {
    if (currentMonth) {
      setLocalCurrentMonth(currentMonth);
    }
  }, [currentMonth]);

  // Helper function to safely parse dates and handle timezone issues
  const safeParseDate = (dateString) => {
    try {
      // Split the date string and reconstruct to ensure no timezone shifts
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      return new Date(year, month - 1, day);
    } catch (error) {
      console.error("Error parsing date:", error, dateString);
      return new Date(); // Fallback to current date
    }
  };

  // Filter transactions for the current month
  const filteredTransactions = transactions?.filter(transaction => {
    if (!transaction.date) return false;
    
    const transactionDate = safeParseDate(transaction.date);
    return isWithinInterval(transactionDate, {
      start: startOfMonth(localCurrentMonth),
      end: endOfMonth(localCurrentMonth)
    });
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
  
  return (
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
          filteredTransactions.map((transaction) => (
            <ListItem 
              key={transaction.id} 
              divider
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => onDelete && onDelete(transaction.id)}
                  sx={{ 
                    transition: 'color 0.2s',
                    color: 'gray',
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
                primary={
                  <Typography 
                    noWrap 
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      maxWidth: { xs: '160px', sm: '100%' } 
                    }}
                  >
                    {transaction.description}
                  </Typography>
                }
                secondary={format(safeParseDate(transaction.date), 'MMM d, yyyy')}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: transaction.type === 'income' ? 'success.main' : 'error.main',
                  mr: 4, // Add margin to the right to make space for the delete icon
                  whiteSpace: 'nowrap'
                }}
              >
                {transaction.type === 'income' ? '+' : '-'}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
              </Typography>
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="No transactions for this month" />
          </ListItem>
        )}
      </List>
    </Paper>
  );
}

export default TransactionsNew; 