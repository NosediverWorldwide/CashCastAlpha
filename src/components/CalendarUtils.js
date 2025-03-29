import { parseISO, isSameDay, compareAsc, isAfter, isBefore } from 'date-fns';

// Helper to parse date safely
export const safeParseISO = (dateString) => {
  try {
    return parseISO(dateString);
  } catch (error) {
    console.error("Invalid date format:", dateString, error);
    return null;
  }
};

// Get expenses for a specific calendar day
export const getExpensesForDay = (calendarDate, expenses) => {
  return expenses.filter(expense => {
    const expenseDate = safeParseISO(expense.date);
    return expenseDate && isSameDay(calendarDate, expenseDate);
  });
};

// Calculate total expenses/income for a day
export const calculateDayTotal = (dayExpenses) => {
  if (!dayExpenses || dayExpenses.length === 0) return 0;
  
  return dayExpenses.reduce((total, expense) => {
    if (expense.type === 'income') {
      return total + parseFloat(expense.amount);
    } else {
      return total - parseFloat(expense.amount);
    }
  }, 0);
};

// Calculate what's available to spend on a given day
export const calculateAvailableToSpend = (date, expenses) => {
  if (!expenses || expenses.length === 0) return 0;
  
  // Calculate total income and expenses up to and including this date
  const relevantExpenses = expenses.filter(expense => {
    const expenseDate = safeParseISO(expense.date);
    return expenseDate && (isBefore(expenseDate, date) || isSameDay(expenseDate, date));
  });
  
  return calculateDayTotal(relevantExpenses);
};

// Get background color based on daily total
export const getDayBackgroundColor = (dayExpenses) => {
  if (!dayExpenses || dayExpenses.length === 0) return 'background.paper';
  
  const dailyTotal = calculateDayTotal(dayExpenses);
  if (dailyTotal > 0) {
    return 'rgba(76, 175, 80, 0.2)'; // Light green for income
  } else if (dailyTotal < 0) {
    return 'rgba(244, 67, 54, 0.2)'; // Light red for expense
  }
  return 'background.paper';
};

// Generate tooltip content for a day
export const getTooltipContent = (date, dayExpenses) => {
  if (!dayExpenses || dayExpenses.length === 0) {
    return "No transactions";
  }
  
  // Sort expenses by type (income first) and then by amount (descending)
  const sortedExpenses = [...dayExpenses].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'income' ? -1 : 1;
    }
    return parseFloat(b.amount) - parseFloat(a.amount);
  });
  
  return (
    <>
      {sortedExpenses.map((expense, index) => (
        <div key={index} style={{ marginBottom: '4px', textAlign: 'left' }}>
          <strong>{expense.description}</strong>: {expense.type === 'income' ? '+' : '-'}${parseFloat(expense.amount).toFixed(2)}
        </div>
      ))}
      <div style={{ marginTop: '8px', textAlign: 'right' }}>
        Total: ${calculateDayTotal(dayExpenses).toFixed(2)}
      </div>
    </>
  );
}; 