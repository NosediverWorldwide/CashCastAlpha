import { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  Grid
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Login({ onToggleForm }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Sending login request...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);
      
      let data;
      try {
        const text = await response.text();
        console.log('Raw response:', text);
        
        if (!text) {
          console.error('Empty response from server');
          throw new Error('Server returned an empty response');
        }
        
        try {
          data = JSON.parse(text);
          console.log('Parsed response:', data);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Invalid JSON response: ${text}`);
        }
      } catch (parseError) {
        console.error('Response parsing error:', parseError);
        throw new Error('Server response was not in the expected format');
      }

      if (!response.ok) {
        console.error('Login error response:', data);
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful:', data);
      login(data.token, data.username);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 8, boxShadow: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                required
                autoFocus
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onToggleForm}
              disabled={isLoading}
            >
              Register here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login; 