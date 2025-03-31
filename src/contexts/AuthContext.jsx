import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    const verifySession = async () => {
      try {
        if (!token || !username) {
          console.log('No stored credentials found');
          setLoading(false);
          return;
        }
        
        console.log('Verifying stored session');
        const response = await fetch('/api/expenses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          console.log('Session verified successfully');
          setUser({ token, username });
        } else {
          console.warn('Session verification failed, clearing stored credentials');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
        }
      } catch (error) {
        console.error('Session verification error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      } finally {
        setLoading(false);
      }
    };
    
    verifySession();
  }, []);

  const login = (token, username) => {
    if (!token || !username) {
      console.error('Invalid login data - missing token or username');
      return;
    }
    
    console.log('Storing session data');
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setUser({ token, username });
  };

  const logout = async () => {
    if (user?.token) {
      try {
        console.log('Sending logout request');
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          console.log('Logout successful');
        } else {
          console.warn('Logout request failed, but continuing with local logout');
        }
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
    
    console.log('Clearing session data');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 