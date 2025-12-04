/**
 * Hook for managing authentication state
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  getToken,
  storeToken,
  removeToken,
  isTokenExpired,
  isValidTokenFormat,
} from '../lib/auth';
import { login as loginAPI } from '../lib/api';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage authentication state and operations
 */
export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check authentication status on mount
  // No cleanup needed: this effect only reads from sessionStorage synchronously
  // and doesn't create any subscriptions or async operations that need cleanup
  useEffect(() => {
    const storedToken = getToken();
    if (
      storedToken &&
      isValidTokenFormat(storedToken) &&
      !isTokenExpired(storedToken)
    ) {
      setToken(storedToken);
    } else if (storedToken) {
      // Token is invalid or expired, remove it
      removeToken();
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await loginAPI(username, password);

        // Store token in sessionStorage
        storeToken(response.token);
        setToken(response.token);

        // Redirect to home (dashboard)
        navigate('/');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao fazer login';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    removeToken();
    setToken(null);
    setError(null);
    navigate('/login');
  }, [navigate]);

  return {
    isAuthenticated:
      !!token && isValidTokenFormat(token) && !isTokenExpired(token),
    token,
    login,

    logout,
    isLoading,
    error,
  };
}
