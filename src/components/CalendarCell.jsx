import { Box, Tooltip, Typography } from '@mui/material';
import { format } from 'date-fns';

// Styles for calendar cells
export const cellStyle = {
  p: 1,
  textAlign: 'center',
  border: '2px solid #111',
  borderRadius: 0,
  minHeight: '80px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '@media (hover: hover)': {
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
    }
  },
  '@media (hover: none)': {
    '&:active': {
      transform: 'scale(0.98)',
      boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
    }
  }
};

function CalendarCell({ 
  date, 
  currentDate, 
  dayExpenses, 
  dailyTotal, 
  displayAmount, 
  getTooltipContent, 
  isDateToday, 
  getDayBackgroundColor,
  onClick,
  showTooltip,
  isSelected
}) {
  const hasTransactions = dayExpenses.length > 0;
  const tooltipContent = getTooltipContent(date, dayExpenses);
  
  const cell = (
    <Box
      onClick={onClick}
      sx={{
        ...cellStyle,
        backgroundColor: getDayBackgroundColor(dayExpenses),
        transform: isSelected ? 'scale(1.02)' : 'none',
        boxShadow: isSelected ? '2px 2px 5px rgba(0,0,0,0.2)' : 'none',
        border: isSelected ? '2px solid #1976d2' : '2px solid #111',
        '@media (hover: hover)': {
          '&:hover': {
            transform: isSelected ? 'scale(1.02)' : 'scale(1.02)',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
          }
        },
        '@media (hover: none)': {
          '&:active': {
            transform: 'scale(0.98)',
            boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
          }
        }
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: isDateToday(date) ? 'bold' : 'normal',
          color: isDateToday(date) ? 'primary.main' : 'text.primary'
        }}
      >
        {format(date, 'd')}
      </Typography>
      {hasTransactions && (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'bold',
            color: displayAmount >= 0 ? 'success.main' : 'error.main'
          }}
        >
          ${Math.abs(displayAmount).toFixed(2)}
        </Typography>
      )}
    </Box>
  );

  // Show tooltip for all days if showTooltip is true
  return showTooltip ? (
    <Tooltip 
      title={tooltipContent}
      arrow
      placement="top"
      enterDelay={200}
      leaveDelay={200}
      enterTouchDelay={0}
      leaveTouchDelay={1500}
    >
      {cell}
    </Tooltip>
  ) : cell;
}

export default CalendarCell; 