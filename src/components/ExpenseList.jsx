import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Box,
  Divider,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function ExpenseList({ expenses, onDelete, isConnected, theme }) {
  // Calculate totals
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>Transactions:</Typography>
      <List sx={{ p: 0 }}> 
        {expenses.map((expense) => (
          <ListItem 
            key={expense.id} 
            disablePadding  
            secondaryAction={
              <IconButton 
                edge="end" 
                aria-label="delete" 
                onClick={() => onDelete(expense.id)} 
                disabled={!isConnected} 
                sx={{ 
                  mr: 1,
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: '#f44336' // Red color on hover
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText 
              sx={{ pl: 2 }}
              primary={expense.description}
              secondary={
                <>
                  <Box component="span" sx={{ color: expense.type === 'income' ? theme.palette.success.main : theme.palette.error.main, fontWeight: 'bold' }}>
                    ${(Number(expense.amount) || 0).toFixed(2)}
                  </Box>
                  <Box component="span" sx={{ color: '#b8b8b8', ml: 1 }}>
                    {expense.date}
                  </Box>
                </>
              }
              primaryTypographyProps={{ fontWeight: 'bold' }}
            />
          </ListItem>
        ))}
        {expenses.length === 0 && (
          <ListItem disablePadding>
            <ListItemText sx={{ pl: 2 }} primary="No transactions yet." />
          </ListItem>
        )}
      </List>
      <Divider sx={{ my: 3 }} />

      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, border: '2px solid #111', bgcolor: theme.palette.success.main, color: '#fff', textAlign: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 'bold' }}>Total Income</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${totalIncome.toFixed(2)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, border: '2px solid #111', bgcolor: theme.palette.error.main, color: '#fff', textAlign: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 'bold' }}>Total Expenses</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${totalExpenses.toFixed(2)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, border: '2px solid #111', bgcolor: netBalance >= 0 ? theme.palette.info.main : theme.palette.warning.main, color: '#fff', textAlign: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 'bold' }}>Net Balance</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${netBalance.toFixed(2)}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default ExpenseList; 