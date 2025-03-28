import { useState } from 'react';
import { Paper, Typography, Grid, Box, Tooltip, Fade } from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

function Calendar({ expenses }) {
  const [currentDate] = useState(new Date());
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const getExpensesForDay = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return expenses.filter(expense => expense.date === dateString);
  };

  const calculateDayTotal = (dayExpenses) => {
    return dayExpenses.reduce((acc, expense) => {
      return acc + (expense.type === 'income' ? expense.amount : -expense.amount);
    }, 0);
  };

  const getDayBackgroundColor = (dayExpenses) => {
    if (dayExpenses.length === 0) return 'background.paper';
    
    const hasExpense = dayExpenses.some(expense => expense.type === 'expense');
    const hasIncome = dayExpenses.some(expense => expense.type === 'income');
    
    if (hasExpense && hasIncome) {
      return 'rgba(255, 235, 238, 0.8)'; // Light red for mixed
    } else if (hasExpense) {
      return 'rgba(255, 235, 238, 0.8)'; // Light red for expenses
    } else if (hasIncome) {
      return 'rgba(232, 245, 233, 0.8)'; // Light green for income
    }
    return 'background.paper';
  };

  const getTooltipContent = (dayExpenses) => {
    if (dayExpenses.length === 0) return '';
    
    return (
      <Box sx={{ 
        p: 1,
        bgcolor: '#7E8083'
      }}>
        {dayExpenses.map(expense => (
          <Typography 
            key={expense.id} 
            variant="body2"
            sx={{
              color: '#FFFFFF',
              fontWeight: 500
            }}
          >
            {expense.description}: ${expense.amount.toFixed(2)}
          </Typography>
        ))}
      </Box>
    );
  };

  const cellStyle = {
    p: 2,
    height: 120,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    width: '100%',
    position: 'relative',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: 2,
      zIndex: 1
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        boxShadow: 3,
        display: { xs: 'none', md: 'block' },
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: 6
        }
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'primary.main',
          mb: 3
        }}
      >
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 1,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        {/* Day headers */}
        {days.map(day => (
          <Box
            key={day}
            sx={{
              p: 1,
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: 1,
              width: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            {day}
          </Box>
        ))}

        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDayOfMonth.getDay() }, (_, i) => (
          <Box key={`empty-${i}`} sx={{ ...cellStyle, backgroundColor: 'background.paper' }} />
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map((date, index) => {
          const dayExpenses = getExpensesForDay(date);
          const total = calculateDayTotal(dayExpenses);
          
          return (
            <Tooltip 
              key={date.toISOString()}
              title={getTooltipContent(dayExpenses)}
              arrow
              placement="top"
              TransitionComponent={Fade}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#7E8083',
                    '& .MuiTooltip-arrow': {
                      color: '#7E8083',
                    },
                  },
                },
              }}
            >
              <Box 
                sx={{ 
                  ...cellStyle,
                  backgroundColor: getDayBackgroundColor(dayExpenses),
                  opacity: isSameMonth(date, currentDate) ? 1 : 0.5
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: isToday(date) ? 'primary.main' : 'text.primary'
                  }}
                >
                  {format(date, 'd')}
                </Typography>
                {dayExpenses.length > 0 && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: total >= 0 ? 'success.dark' : 'error.dark'
                    }}
                  >
                    ${Math.abs(total).toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Paper>
  );
}

export default Calendar; 