import { createTheme } from '@mui/material';

// Define the Neo-Brutalist theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#111111' },
    success: { main: '#4caf50' }, 
    error: { main: '#f44336' },
    info: { main: '#2196f3' },
    warning: { main: '#ff9800' },
  },
  typography: {
    fontFamily: '"Inter", system-ui, Avenir, Helvetica, Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 'bold' }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '2px solid #111',
          borderRadius: 0,
          boxShadow: '4px 4px 0px #111',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '2px solid #111',
          boxShadow: '2px 2px 0px #111',
          transition: 'transform 0.1s ease-in-out, boxShadow 0.1s ease-in-out',
          '&:hover': {
            transform: 'translate(-1px, -1px)',
            boxShadow: '3px 3px 0px #111',
          },
          '&:active': {
            transform: 'translate(1px, 1px)',
            boxShadow: '1px 1px 0px #111',
          }
        },
        containedPrimary: { backgroundColor: '#1976d2', color: '#fff', '&:hover': { backgroundColor: '#1565c0' } },
        containedSecondary: { backgroundColor: '#dc004e', color: '#fff', '&:hover': { backgroundColor: '#9a0036' } }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            borderWidth: '2px',
            borderColor: '#111',
            '& fieldset': { border: '2px solid #111' },
              '&:hover fieldset': { borderColor: '#111' },
            '&.Mui-focused fieldset': { borderColor: '#111', borderWidth: '2px' },
          },
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderBottom: '2px solid #111',
          borderRadius: 0,
          paddingTop: '12px',
          paddingBottom: '12px',
          transition: 'none',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: { background: '#fff', color: '#111', borderBottom: '2px solid #111', boxShadow: 'none', position: 'static' }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { border: '2px solid #111', borderRadius: 0, boxShadow: '4px 4px 0px #111' }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 0, border: '2px solid #111' },
        filled: { border: '2px solid #111' }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderBottomWidth: '2px', borderColor: '#111' }
      }
    }
  }
});

export default theme; 