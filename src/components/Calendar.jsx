import { useState, useEffect } from 'react';
import { Paper, Typography, Box, IconButton } from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// Import utility functions and components
import { 
  getExpensesForDay, 
  calculateDayTotal, 
  calculateAvailableToSpend,
  getDayBackgroundColor,
  getTooltipContent
} from './CalendarUtils.jsx';
import CalendarCell, { cellStyle } from './CalendarCell';

function Calendar({ expenses, currentMonth, onMonthChange }) {
  const [localCurrentDate, setLocalCurrentDate] = useState(currentMonth || new Date());
  const [expanded, setExpanded] = useState(true);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Sync with external currentMonth if provided
  useEffect(() => {
    if (currentMonth && onMonthChange) {
      setLocalCurrentDate(currentMonth);
    }
  }, [currentMonth]);

  const firstDayOfMonth = startOfMonth(localCurrentDate);
  const lastDayOfMonth = endOfMonth(localCurrentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const handlePrevMonth = () => {
    const newDate = subMonths(localCurrentDate, 1);
    setLocalCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = addMonths(localCurrentDate, 1);
    setLocalCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Custom function to pass all expenses to the tooltip content
  const getTooltipWithAllExpenses = (date, dayExpenses) => {
    return getTooltipContent(date, dayExpenses, expenses);
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expanded ? 3 : 0 }}>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            mb: 0
          }}
        >
          <IconButton onClick={handlePrevMonth} size="small">
            <ArrowBackIosNewIcon fontSize="inherit" />
          </IconButton>
          {monthNames[localCurrentDate.getMonth()]} {localCurrentDate.getFullYear()}
          <IconButton onClick={handleNextMonth} size="small">
            <ArrowForwardIosIcon fontSize="inherit" />
          </IconButton>
        </Typography>
        <IconButton 
          onClick={toggleExpanded}
          sx={{ 
            transition: 'transform 0.3s',
            transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
            border: '2px solid #111',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.05)'
            }
          }}
        >
          {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      {expanded && (
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
          {daysInMonth.map((date) => {
            const dayExpenses = getExpensesForDay(date, expenses);
            const dailyTotal = calculateDayTotal(dayExpenses);
            let displayAmount = dailyTotal;

            if (isToday(date)) {
              displayAmount = calculateAvailableToSpend(date, expenses);
            }
            
            return (
              <CalendarCell
                key={date.toISOString()}
                date={date}
                currentDate={localCurrentDate}
                dayExpenses={dayExpenses}
                dailyTotal={dailyTotal}
                displayAmount={displayAmount}
                getTooltipContent={(date, expenses) => getTooltipWithAllExpenses(date, expenses)}
                isDateToday={isToday}
                getDayBackgroundColor={getDayBackgroundColor}
              />
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

export default Calendar; 