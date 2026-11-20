import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then((response) => setUser(response.data))
      .catch((error) => {
        setUser(null);
        if (error.response && error.response.status !== 401) {
          setBootstrapError(error.response.data?.message || 'Unable to verify your session.');
        }
      })
      .finally(() => setReady(true));
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setUser(null);
    }
  };

  const clearUser = () => {
    setUser(null);
  };

  const value = useMemo(() => ({ user, ready, bootstrapError, setUser, login, logout, clearUser }), [user, ready, bootstrapError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
