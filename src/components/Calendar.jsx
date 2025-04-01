import { useState, useEffect } from 'react';
import { Paper, Typography, Box, IconButton, Tooltip, Fade, useTheme, useMediaQuery } from '@mui/material';
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
  const [show, setShow] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [firstDayOfMonth, setFirstDayOfMonth] = useState(startOfMonth(localCurrentDate));
  const [lastDayOfMonth, setLastDayOfMonth] = useState(endOfMonth(localCurrentDate));
  const [daysInMonth, setDaysInMonth] = useState(
    eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Sync with external currentMonth if provided
  useEffect(() => {
    if (currentMonth && onMonthChange) {
      setLocalCurrentDate(currentMonth);
    }
  }, [currentMonth, onMonthChange]);

  // Add effect to handle expenses updates with debounce
  useEffect(() => {
    // Initialize calendar data regardless of expenses status
    const newFirstDay = startOfMonth(localCurrentDate);
    const newLastDay = endOfMonth(localCurrentDate);
    const newDaysInMonth = eachDayOfInterval({ start: newFirstDay, end: newLastDay });
    setFirstDayOfMonth(newFirstDay);
    setLastDayOfMonth(newLastDay);
    setDaysInMonth(newDaysInMonth);
    
    // Only apply fade effects if we have expenses
    if (expenses && Array.isArray(expenses)) {
      setShow(false);
      const timer = setTimeout(() => {
        setShow(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, [expenses, localCurrentDate]);

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

  const handleDayClick = (date, hasTransactions) => {
    if (isTablet && hasTransactions) {
      setSelectedDay(selectedDay?.getTime() === date.getTime() ? null : date);
    }
  };

  // If mobile, return null after all hooks are defined
  if (isMobile) {
    return null;
  }

  return (
    <Fade in={show} timeout={300}>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          display: 'block',
          width: '100%',
          boxShadow: 3
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
              transition: 'transform 0.3s ease-in-out',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              border: '2px solid #111',
              '@media (hover: hover)': {
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  transform: expanded ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'
                }
              },
              '@media (hover: none)': {
                '&:active': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  transform: expanded ? 'rotate(180deg) scale(0.95)' : 'rotate(0deg) scale(0.95)'
                }
              }
            }}
          >
            <KeyboardArrowDownIcon />
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
              <Box 
                key={`empty-${i}`} 
                sx={{ 
                  ...cellStyle, 
                  backgroundColor: 'background.paper',
                  border: '2px solid #e0e0e0'
                }} 
              />
            ))}
            
            {/* Days of the month */}
            {daysInMonth.map((date) => {
              const dayExpenses = getExpensesForDay(date, expenses);
              const dailyTotal = calculateDayTotal(dayExpenses);
              let displayAmount = dailyTotal;

              if (isToday(date)) {
                displayAmount = calculateAvailableToSpend(date, expenses);
              }
              
              const isSelected = selectedDay?.getTime() === date.getTime();
              const hasTransactions = dayExpenses.length > 0;
              
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
                  onClick={() => handleDayClick(date, hasTransactions)}
                  showTooltip={!isTablet || (isTablet && isSelected)}
                  isSelected={isSelected}
                />
              );
            })}
          </Box>
        )}
      </Paper>
    </Fade>
  );
}

export default Calendar; 