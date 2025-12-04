/**
 * Hook for managing authentication state
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { login as loginAPI } from '../lib/api';
import {
  getToken,
  isTokenExpired,
  isValidTokenFormat,
  removeToken,
  storeToken,
} from '../lib/auth';

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

  useEffect(() => {
    const storedToken = getToken();
    if (
      storedToken &&
      isValidTokenFormat(storedToken) &&
      !isTokenExpired(storedToken)
    ) {
      setToken(storedToken);
    } else if (storedToken) {
      removeToken();
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await loginAPI(username, password);

        storeToken(response.token);
        setToken(response.token);

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
