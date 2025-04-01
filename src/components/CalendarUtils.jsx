import { parseISO, isSameDay, compareAsc, isAfter, isBefore } from 'date-fns';
import React from 'react';

// Helper to parse date safely
export const safeParseISO = (dateString) => {
  try {
    // Split the date string and reconstruct to ensure no timezone shifts
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      // Create a date string that's timezone-independent
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    }
    // If not a string with dashes, try to parse as ISO
    const date = new Date(dateString);
    // Normalize to UTC noon
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0, 0
    ));
  } catch (error) {
    console.error("Invalid date format:", dateString, error);
    return null;
  }
};

// Get expenses for a specific calendar day
export const getExpensesForDay = (calendarDate, expenses) => {
  if (!expenses || !Array.isArray(expenses)) return [];
  
  // Normalize calendar date to UTC noon
  const normalizedCalendarDate = new Date(Date.UTC(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
    calendarDate.getDate(),
    12, 0, 0, 0
  ));
  
  return expenses.filter(expense => {
    try {
      const expenseDate = safeParseISO(expense.date);
      if (!expenseDate) return false;
      
      // Compare UTC dates
      return expenseDate.getUTCFullYear() === normalizedCalendarDate.getUTCFullYear() &&
             expenseDate.getUTCMonth() === normalizedCalendarDate.getUTCMonth() &&
             expenseDate.getUTCDate() === normalizedCalendarDate.getUTCDate();
    } catch (error) {
      console.error("Error processing expense:", expense, error);
      return false;
    }
  });
};

// Calculate total expenses/income for a day
export const calculateDayTotal = (dayExpenses) => {
  if (!dayExpenses || dayExpenses.length === 0) return 0;
  
  return dayExpenses.reduce((total, expense) => {
    const amount = parseFloat(expense.amount || 0);
    if (expense.type === 'income') {
      return total + amount;
    } else {
      return total - amount;
    }
  }, 0);
};

// Find next income date after the given date
const findNextIncomeDate = (date, expenses) => {
  console.log(`\nFinding next income date after ${date.toISOString()}`);
  
  const futureIncomes = expenses
    .filter(expense => {
      const expenseDate = safeParseISO(expense.date);
      const isIncome = expense.type === 'income';
      const isAfterDate = expenseDate && isAfter(expenseDate, date);
      
      console.log(`Expense: ${expense.description}, Date: ${expenseDate?.toISOString()}, Type: ${expense.type}, IsAfter: ${isAfterDate}`);
      
      return isIncome && isAfterDate;
    })
    .sort((a, b) => {
      const dateA = safeParseISO(a.date);
      const dateB = safeParseISO(b.date);
      return compareAsc(dateA, dateB);
    });
  
  console.log('Future incomes found:', futureIncomes);
  const nextDate = futureIncomes.length > 0 ? safeParseISO(futureIncomes[0].date) : null;
  console.log('Next income date:', nextDate?.toISOString());
  
  return nextDate;
};

// Calculate what's available to spend on a given day
export const calculateAvailableToSpend = (date, expenses) => {
  console.log('Calculating available to spend for date:', date.toISOString());
  console.log('All expenses:', expenses);

  // Get all expenses up to the current date (inclusive)
  const expensesUpToDate = expenses.filter(expense => 
    expense.date <= date.toISOString().split('T')[0]
  );
  console.log('Expenses up to current date:', expensesUpToDate);

  // Calculate running balance from these expenses
  const runningBalance = expensesUpToDate.reduce((balance, expense) => {
    if (expense.type === 'income') {
      return balance + expense.amount;
    } else {
      return balance - expense.amount;
    }
  }, 0);
  console.log('Running balance:', runningBalance);

  // Find next income date
  const nextIncomeDate = findNextIncomeDate(date, expenses);
  console.log('Next income date:', nextIncomeDate);

  if (!nextIncomeDate) {
    console.log('No next income date found, returning running balance');
    return runningBalance;
  }

  // Get future expenses between current date (exclusive) and next income date (inclusive)
  const futureExpenses = expenses.filter(expense => {
    const expenseDate = expense.date;
    return expenseDate > date.toISOString().split('T')[0] && 
           expenseDate <= nextIncomeDate;
  });
  console.log('Future expenses until next income:', futureExpenses);

  // Sum up future expenses
  const futureExpensesSum = futureExpenses.reduce((sum, expense) => {
    if (expense.type === 'expense') {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
  console.log('Sum of future expenses:', futureExpensesSum);

  // Calculate available amount
  // We don't add the next income amount since it's already included in the running balance
  const availableAmount = runningBalance - futureExpensesSum;
  console.log('Final available amount:', availableAmount);

  return availableAmount;
};

// Get background color based on daily total
export const getDayBackgroundColor = (dayExpenses) => {
  if (!dayExpenses || dayExpenses.length === 0) return 'background.paper';
  
  // Check if there are both income and expense transactions
  const hasIncome = dayExpenses.some(expense => expense.type === 'income');
  const hasExpense = dayExpenses.some(expense => expense.type === 'expense');
  
  if (hasIncome && hasExpense) {
    return 'rgba(255, 214, 0, 0.2)'; // Neo-brutalist yellow for mixed transactions
  } else if (hasIncome) {
    return 'rgba(76, 175, 80, 0.2)'; // Light green for income
  } else if (hasExpense) {
    return 'rgba(244, 67, 54, 0.2)'; // Light red for expense
  }
  return 'background.paper';
};

// Generate tooltip content for a day
export const getTooltipContent = (date, dayExpenses, allExpenses) => {
  try {
    // Calculate available amount to spend
    const availableAmount = calculateAvailableToSpend(date, allExpenses || []);
    
    return (
      <div style={{ padding: '8px' }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          borderBottom: '1px solid #ddd', 
          paddingBottom: '4px',
          color: availableAmount >= 0 ? 'success.main' : 'error.main'
        }}>
          Available to spend: ${Math.abs(availableAmount).toFixed(2)}
        </div>
        
        {dayExpenses && dayExpenses.length > 0 ? (
          <>
            {dayExpenses.map((expense, index) => (
              <div key={index} style={{ marginBottom: '4px', textAlign: 'left' }}>
                <strong>{expense.description}</strong>: {expense.type === 'income' ? '+' : '-'}${parseFloat(expense.amount || 0).toFixed(2)}
              </div>
            ))}
            <div style={{ marginTop: '8px', textAlign: 'right', fontWeight: 'bold' }}>
              Day Total: ${calculateDayTotal(dayExpenses).toFixed(2)}
            </div>
          </>
        ) : (
          <div>No transactions on this day</div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error generating tooltip content:", error);
    return <div>Error displaying transaction details</div>;
  }
}; 