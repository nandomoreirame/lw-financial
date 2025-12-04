/**
 * Hook for fetching a bank account by its unique code using React Query
 * Handles account lookup operations and cache management
 */

import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { getAccountByCode, type AccountBalance } from '../lib/api';
import { isAuthenticationError, redirectToLogin } from '../lib/auth-redirect';
import { isValidAccountCodeFormat } from '../lib/validators';

export interface UseAccountByCodeReturn {
  account: AccountBalance | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch a bank account by its unique code
 * Automatically handles authentication errors by redirecting to login
 * @param code - Account code in format "XXXX-X"
 */
export function useAccountByCode(
  code: string | undefined
): UseAccountByCodeReturn {
  const { data, isLoading, error, refetch } = useQuery<AccountBalance>({
    queryKey: ['account-by-code', code],
    queryFn: () => {
      if (!code) {
        throw new Error('Account code is required');
      }
      if (!isValidAccountCodeFormat(code)) {
        throw new Error('Invalid account code format. Expected format: XXXX-X');
      }
      return getAccountByCode(code);
    },
    enabled: !!code && isValidAccountCodeFormat(code),
    staleTime: 30000, // 30 seconds
    retry: 1,
  });

  React.useEffect(() => {
    if (error && isAuthenticationError(error)) {
      redirectToLogin('Sua sessão expirou. Por favor, faça login novamente');
    }
  }, [error]);

  return {
    account: data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
