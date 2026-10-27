import { useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

/**
 * Auth context hook — manages user state and auth operations.
 * Used as a simple lifted-state pattern (no Context API needed for this size).
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const data = await authAPI.getMe();
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authAPI.login(credentials);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authAPI.register(formData);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
