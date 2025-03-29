import { Dialog, DialogContent } from '@mui/material';
import Login from './Login';
import Register from './Register';

function LoginDialog({ isOpen, isLoginView, onToggleForm, onSuccess }) {
  return (
    <Dialog open={isOpen} fullWidth maxWidth="xs" PaperProps={{ elevation: 0 }}>
      <DialogContent sx={{ border: 'none', boxShadow: 'none' }}>
        {isLoginView ? (
          <Login onToggleForm={onToggleForm} onSuccess={onSuccess} />
        ) : (
          <Register onToggleForm={onToggleForm} onSuccess={onSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog; 