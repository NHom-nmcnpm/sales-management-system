import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './auth.js';
import { api, setCsrfToken } from '../services/api.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const clearSession = useCallback(() => {
    setUser(null);
    setCsrfToken('');
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/auth/me', { signal: controller.signal })
      .then(({ data }) => {
        setUser(data.data.user);
        setCsrfToken(data.data.csrfToken);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    window.addEventListener('session-expired', clearSession);
    return () => {
      controller.abort();
      window.removeEventListener('session-expired', clearSession);
    };
  }, [clearSession]);
  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.data.user);
    setCsrfToken(data.data.csrfToken);
    return data.data.user;
  }
  async function logout() {
    await api.post('/auth/logout', {});
    clearSession();
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, clearSession, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
