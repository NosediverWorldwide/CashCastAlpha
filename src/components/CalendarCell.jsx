import { Box, Typography, Tooltip, Fade } from '@mui/material';
import { isToday, isSameMonth, format } from 'date-fns';

// Styles for calendar cells
export const cellStyle = {
  p: 1,
  height: '80px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  cursor: 'pointer',
  border: '2px solid #111',
  borderColor: '#111',
  borderRadius: 0,
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '4px 4px 0px #111',
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
  getDayBackgroundColor 
}) {
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
}

export default CalendarCell; 