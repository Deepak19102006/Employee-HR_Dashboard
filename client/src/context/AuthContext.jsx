import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const saved = localStorage.getItem('token');
      if (saved) setAuthToken(saved);
      return saved || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate existing session once on initial app load
  useEffect(() => {
    async function loadSavedSession() {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setAuthToken(savedToken);
        try {
          const res = await api.getProfile();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Saved session expired:', err.message);
          setAuthToken(null);
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }

    loadSavedSession();
  }, []);

  // Listen for auto-logout events from API client (e.g. 401 response)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setToken(null);
      setAuthToken(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    if (res?.success && res.token && res.user) {
      // 1. Immediately persist token & user to memory and storage
      setAuthToken(res.token);
      try {
        localStorage.setItem('user', JSON.stringify(res.user));
      } catch {}

      // 2. Update React states
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res?.message || 'Login failed. Please check your credentials.');
  };

  const registerEmployee = async (credentials) => {
    const res = await api.registerEmployee(credentials);
    if (res?.success && res.token && res.user) {
      setAuthToken(res.token);
      try {
        localStorage.setItem('user', JSON.stringify(res.user));
      } catch {}
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res?.message || 'Registration failed.');
  };

  const logout = () => {
    setAuthToken(null);
    try {
      localStorage.removeItem('user');
    } catch {}
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res?.user) {
        setUser(res.user);
        try {
          localStorage.setItem('user', JSON.stringify(res.user));
        } catch {}
      }
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      registerEmployee,
      logout,
      refreshProfile,
      loading,
      isHR: user?.role === 'hr',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
