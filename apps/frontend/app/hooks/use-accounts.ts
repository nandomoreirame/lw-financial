/**
 * Hook for fetching user bank accounts using React Query
 * Handles account list operations and cache management
 */

import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import {
  getAccounts,
  type AccountBalance,
  type AccountsResponse,
} from '../lib/api';
import { isAuthenticationError, redirectToLogin } from '../lib/auth-redirect';

export interface UseAccountsReturn {
  accounts: AccountsResponse;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch all bank accounts for the authenticated user
 * Automatically handles authentication errors by redirecting to login
 */
export function useAccounts(): UseAccountsReturn {
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AccountsResponse>({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });

  React.useEffect(() => {
    if (error && isAuthenticationError(error)) {
      redirectToLogin('Sua sessão expirou. Por favor, faça login novamente');
    }
  }, [error]);

  return {
    accounts: data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Gets the first account (oldest by createdAt) from the accounts list
 * @param accounts - Array of accounts
 * @returns First account or undefined if list is empty
 */
export function getFirstAccount(
  accounts: AccountsResponse
): AccountBalance | undefined {
  if (accounts.length === 0) {
    return undefined;
  }

  return accounts[0];
}
