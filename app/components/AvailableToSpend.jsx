import { format } from 'date-fns';

function AvailableToSpend({ transactions, budget }) {
  console.log("AvailableToSpend component rendering with budget:", budget);
  // Calculate available money to spend today
  // This is a simple implementation - you might need to adjust the logic based on your requirements
  const calculateAvailableToSpend = () => {
    // Get today's date
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd');
    
    // Sum up all transactions up to today
    const totalSpent = transactions
      .filter(transaction => transaction.date <= formattedToday && transaction.amount < 0)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    
    // Calculate remaining budget
    const availableToSpend = budget - totalSpent;
    return availableToSpend > 0 ? availableToSpend : 0;
  };

  const availableAmount = calculateAvailableToSpend();

  return (
    <div className="available-to-spend-section">
      <h2>Available money to spend today</h2>
      <div className="available-amount">${availableAmount.toFixed(2)}</div>
    </div>
  );
}

export default AvailableToSpend; 