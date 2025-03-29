import { parseISO, isSameDay, compareAsc, isAfter, isBefore } from 'date-fns';
import React from 'react';

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
  if (!expenses || expenses.length === 0) return 0;
  
  // 1. Calculate running balance up to and including this date
  const runningBalance = expenses
    .filter(expense => {
      const expenseDate = safeParseISO(expense.date);
      return expenseDate && (isBefore(expenseDate, date) || isSameDay(expenseDate, date));
    })
    .reduce((total, expense) => {
      const amount = parseFloat(expense.amount);
      return total + (expense.type === 'income' ? amount : -amount);
    }, 0);
  
  // 2. Find next income date
  const nextIncomeDate = findNextIncomeDate(date, expenses);
  
  // 3. Sum future expenses between this date (exclusive) and next income (exclusive)
  const futureExpensesSum = expenses
    .filter(expense => {
      const expenseDate = safeParseISO(expense.date);
      return (
        expense.type === 'expense' && 
        expenseDate && 
        isAfter(expenseDate, date) && 
        (!nextIncomeDate || isBefore(expenseDate, nextIncomeDate))
      );
    })
    .reduce((total, expense) => total + parseFloat(expense.amount), 0);
  
  // Available to spend = current balance minus upcoming expenses
  return runningBalance - futureExpensesSum;
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
export const getTooltipContent = (date, dayExpenses, allExpenses) => {
  // Calculate available amount to spend
  const availableAmount = calculateAvailableToSpend(date, allExpenses);
  
  return (
    <div style={{ padding: '8px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
        Available to spend: ${availableAmount.toFixed(2)}
      </div>
      
      {dayExpenses && dayExpenses.length > 0 ? (
        <>
          {dayExpenses.map((expense, index) => (
            <div key={index} style={{ marginBottom: '4px', textAlign: 'left' }}>
              <strong>{expense.description}</strong>: {expense.type === 'income' ? '+' : '-'}${parseFloat(expense.amount).toFixed(2)}
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
}; 