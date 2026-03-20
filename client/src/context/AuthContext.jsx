import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('kalvi_token'));
  const [loading, setLoading] = useState(true);

  // Attach token to every axios request
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('kalvi_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('kalvi_token');
    }
  }, [token]);

  // Verify stored token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => { setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (fields) => {
    const res = await axios.post('/api/auth/register', fields);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);


  const syncProgress = useCallback(async (progress) => {
    if (!token) return;
    try { await axios.patch('/api/auth/progress', progress); } catch {}
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, syncProgress }}>
      {children}
    </AuthContext.Provider>
  );
}
