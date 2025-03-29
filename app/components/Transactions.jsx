import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

function Transactions({ transactions }) {
  console.log("Transactions component rendering with data:", transactions);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filter transactions for the current month
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return isWithinInterval(transactionDate, {
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  });
  
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  return (
    <div className="transactions-section">
      <div className="transactions-header">
        <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
      </div>
      
      <div className="transactions-list">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-details">
                <div className="transaction-name">{transaction.name}</div>
                <div className="transaction-date">{format(new Date(transaction.date), 'MMM d')}</div>
              </div>
              <div className={`transaction-amount ${transaction.amount < 0 ? 'negative' : 'positive'}`}>
                {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))
        ) : (
          <div className="no-transactions">No transactions for this month</div>
        )}
      </div>
    </div>
  );
}

export default Transactions; 