import { useState } from 'react';
import { Paper, Typography, Grid, Box, Tooltip, Fade, IconButton } from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO, isSameDay, isBefore, compareAsc, isAfter } from 'date-fns';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Helper to parse date safely
const safeParseISO = (dateString) => {
  try {
    return parseISO(dateString);
  } catch (error) {
    console.error("Invalid date format:", dateString, error);
    return null;
  }
};

function Calendar({ expenses }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getExpensesForDay = (calendarDate) => {
    return expenses.filter(expense => {
      const expenseDate = safeParseISO(expense.date); 
      return expenseDate && isSameDay(calendarDate, expenseDate);
    });
  };

  const calculateDayTotal = (dayExpenses) => {
    return dayExpenses.reduce((acc, expense) => {
      const amount = Number(expense.amount) || 0;
      return acc + (expense.type === 'income' ? amount : -amount);
    }, 0);
  };

  // Calculates the running balance considering future expenses before next income
  const calculateAvailableToSpend = (targetDate, allExpenses) => {
    // 1. Sort expenses by date
    const sortedExpenses = [...allExpenses]
      .map(exp => ({ ...exp, parsedDate: safeParseISO(exp.date) }))
      .filter(exp => exp.parsedDate) // Filter out invalid dates
      .sort((a, b) => compareAsc(a.parsedDate, b.parsedDate));

    // 2. Calculate running balance up to targetDate
    let runningBalance = 0;
    sortedExpenses.forEach(expense => {
      if (isBefore(expense.parsedDate, targetDate) || isSameDay(expense.parsedDate, targetDate)) {
        const amount = Number(expense.amount) || 0;
        runningBalance += (expense.type === 'income' ? amount : -amount);
      }
    });

    // 3. Find next income date after targetDate
    let nextIncomeDate = null;
    for (const expense of sortedExpenses) {
      if (expense.type === 'income' && isAfter(expense.parsedDate, targetDate)) {
        nextIncomeDate = expense.parsedDate;
        break;
      }
    }

    // 4. Find sum of expenses between targetDate (exclusive) and nextIncomeDate (inclusive)
    let futureExpensesSum = 0;
    sortedExpenses.forEach(expense => {
      if (expense.type === 'expense' && isAfter(expense.parsedDate, targetDate)) {
        // If there is a next income date, only consider expenses before or on that date
        // Otherwise (no next income), consider all future expenses
        if (!nextIncomeDate || isBefore(expense.parsedDate, nextIncomeDate) || isSameDay(expense.parsedDate, nextIncomeDate)) {
          futureExpensesSum += (Number(expense.amount) || 0);
        }
      }
    });

    // 5. Return running balance minus future expenses
    return runningBalance - futureExpensesSum;
  };

  const getDayBackgroundColor = (dayExpenses) => {
    if (dayExpenses.length === 0) return 'background.paper';
    const hasExpense = dayExpenses.some(expense => expense.type === 'expense');
    const hasIncome = dayExpenses.some(expense => expense.type === 'income');
    if (hasExpense && hasIncome) return 'rgba(255, 235, 238, 0.8)';
    if (hasExpense) return 'rgba(255, 235, 238, 0.8)';
    if (hasIncome) return 'rgba(232, 245, 233, 0.8)';
    return 'background.paper';
  };

  const getTooltipContent = (date, dayExpenses) => {
    const availableAmount = calculateAvailableToSpend(date, expenses); // Use new function
    
    const tooltipContent = [
      <Typography key="available" variant="body2" sx={{ color: '#FFFFFF', fontWeight: 'bold', mb: dayExpenses.length > 0 ? 1 : 0 }}>
        Available to spend: ${availableAmount.toFixed(2)}
      </Typography>
    ];

    if (dayExpenses.length > 0) {
      dayExpenses.forEach(expense => {
        tooltipContent.push(
          <Typography 
            key={expense.id} 
            variant="body2"
            sx={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.8rem' }}
          >
            {expense.description}: ${expense.amount.toFixed(2)} ({expense.type})
          </Typography>
        );
      });
    }
    
    return (
      <Box sx={{ p: 1, bgcolor: '#7E8083' }}>
        {tooltipContent}
      </Box>
    );
  };

  const cellStyle = {
    p: 2,
    height: 120,
    border: '2px solid #111',
    borderColor: '#111',
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    width: '100%',
    position: 'relative',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '4px 4px 0px #111',
      zIndex: 1
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        display: { xs: 'none', md: 'block' },
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
        <IconButton onClick={handlePrevMonth} size="small">
          <ArrowBackIosNewIcon fontSize="inherit" />
        </IconButton>
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        <IconButton onClick={handleNextMonth} size="small">
          <ArrowForwardIosIcon fontSize="inherit" />
        </IconButton>
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
              borderRadius: 0,
              width: '100%',
              border: '2px solid #111',
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
          const dailyTotal = calculateDayTotal(dayExpenses);
          let displayAmount = dailyTotal;

          if (isToday(date)) {
            displayAmount = calculateAvailableToSpend(date, expenses);
          }
          
          return (
            <Tooltip 
              key={date.toISOString()}
              title={getTooltipContent(date, dayExpenses)}
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
                  backgroundColor: isToday(date) ? '#1976d2' : getDayBackgroundColor(dayExpenses),
                  opacity: isSameMonth(date, currentDate) ? 1 : 0.5
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: isToday(date) ? 'white' : 'text.primary'
                  }}
                >
                  {format(date, 'd')}
                </Typography>
                {(isToday(date) || dayExpenses.length > 0) && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: isToday(date) ? 'white' : (dailyTotal >= 0 ? 'success.dark' : 'error.dark')
                    }}
                  >
                    {isToday(date) ? `Available: $${displayAmount.toFixed(2)}` : `$${dailyTotal.toFixed(2)}`}
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