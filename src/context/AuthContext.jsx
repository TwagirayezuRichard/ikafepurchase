import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'rpms_session_token';
const USER_KEY = 'rpms_session_user';

function readStoredSession() {
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  const storedUser = window.sessionStorage.getItem(USER_KEY);
  if (!token || !storedUser) return { token, user: null };
  try {
    return { token, user: JSON.parse(storedUser) };
  } catch {
    window.sessionStorage.removeItem(USER_KEY);
    return { token, user: null };
  }
}

function storeUser(user) {
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export const AuthProvider = ({ children }) => {
  const [initialSession] = useState(readStoredSession);
  const [user, setUser] = useState(initialSession.user);
  const [ready, setReady] = useState(!initialSession.token || Boolean(initialSession.user));
  const [bootstrapError, setBootstrapError] = useState('');

  useEffect(() => {
    if (!initialSession.token) {
      setReady(true);
      return;
    }
    api.get('/auth/me')
      .then((response) => setUser(storeUser(response.data)))
      .catch((error) => {
        setUser(null);
        if (error.response?.status === 401) {
          window.sessionStorage.removeItem(TOKEN_KEY);
          window.sessionStorage.removeItem(USER_KEY);
        }
        if (error.response && error.response.status !== 401) {
          setBootstrapError(error.response.data?.message || 'Unable to verify your session.');
        }
      })
      .finally(() => setReady(true));
  }, [initialSession.token]);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials, { timeout: 90000 });
    if (response.data.token) {
      window.sessionStorage.setItem(TOKEN_KEY, response.data.token);
    }
    setUser(storeUser(response.data.user));
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      window.sessionStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(USER_KEY);
      setUser(null);
    }
  };

  const clearUser = () => {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, ready, bootstrapError, setUser, login, logout, clearUser }), [user, ready, bootstrapError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
