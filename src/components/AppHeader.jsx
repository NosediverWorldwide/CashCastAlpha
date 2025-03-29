import { Typography, Button, AppBar, Toolbar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

function AppHeader({ user, onLogout }) {
  return (
    <AppBar>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          CashCast
        </Typography>
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
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader; 