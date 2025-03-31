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
  const futureIncomes = expenses
    .filter(expense => {
      const expenseDate = safeParseISO(expense.date);
      return expense.type === 'income' && expenseDate && isAfter(expenseDate, date);
    })
    .sort((a, b) => {
      const dateA = safeParseISO(a.date);
      const dateB = safeParseISO(b.date);
      return compareAsc(dateA, dateB);
    });
  
  return futureIncomes.length > 0 ? safeParseISO(futureIncomes[0].date) : null;
};

// Calculate what's available to spend on a given day
export const calculateAvailableToSpend = (date, expenses) => {
  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) return 0;
  
  try {
    // 1. Calculate running balance up to and including this date
    const runningBalance = expenses
      .filter(expense => {
        try {
          const expenseDate = safeParseISO(expense.date);
          return expenseDate && (isBefore(expenseDate, date) || isSameDay(expenseDate, date));
        } catch (error) {
          console.error("Error in filter:", error);
          return false;
        }
      })
      .reduce((total, expense) => {
        const amount = parseFloat(expense.amount || 0);
        return total + (expense.type === 'income' ? amount : -amount);
      }, 0);
    
    // 2. Find next income date
    const nextIncomeDate = findNextIncomeDate(date, expenses);
    
    // 3. Sum future expenses between this date (exclusive) and next income (exclusive)
    const futureExpensesSum = expenses
      .filter(expense => {
        try {
          const expenseDate = safeParseISO(expense.date);
          return (
            expense.type === 'expense' && 
            expenseDate && 
            isAfter(expenseDate, date) && 
            (!nextIncomeDate || isBefore(expenseDate, nextIncomeDate))
          );
        } catch (error) {
          console.error("Error in future expenses filter:", error);
          return false;
        }
      })
      .reduce((total, expense) => total + parseFloat(expense.amount || 0), 0);
    
    // Available to spend = current balance minus upcoming expenses
    return runningBalance - futureExpensesSum;
  } catch (error) {
    console.error("Error calculating available to spend:", error);
    return 0;
  }
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
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
          Available to spend: ${availableAmount.toFixed(2)}
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