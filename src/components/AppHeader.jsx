import { Typography, Button, AppBar, Toolbar, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

function AppHeader({ user, onLogout }) {
  return (
    <AppBar>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}
        >
          CashCast
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {user ? (
            <Button 
              color="inherit" 
              variant="outlined" 
              onClick={onLogout} 
              startIcon={<LogoutIcon/>}
            >
              Logout
            </Button>
          ) : (
            <Typography sx={{ fontWeight: 'bold' }}>
              Please log in
            </Typography>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader; 