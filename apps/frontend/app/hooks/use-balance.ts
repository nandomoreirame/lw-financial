/**
 * Hook for fetching and managing account balance using React Query
 */

import { formatCurrency } from '@lw-financial/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { getBalance } from '../lib/api';

export interface UseBalanceReturn {
  balance: number | undefined;
  formattedBalance: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage account balance
 * Automatically invalidates cache after banking operations
 * @param accountCode - Account code in format "XXXX-X" (optional). If not provided, returns default account balance
 */
export function useBalance(accountCode?: string): UseBalanceReturn {
  const queryClient = useQueryClient();

  const {
    data: balance,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['balance', accountCode || 'default'],
    queryFn: async () => {
      return getBalance(accountCode);
    },
    enabled: true,
    staleTime: 0,
    retry: 1,
  });

  const formattedBalance = balance !== undefined ? formatCurrency(balance) : '';

  const refetch = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['balance', accountCode || 'default'],
    });
  }, [accountCode, queryClient]);

  return {
    balance,
    formattedBalance,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
