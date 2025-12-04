/**
 * Hook for fetching and managing account balance using React Query
 */

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBalance } from '../lib/api';
import { formatCurrency } from '@lw-financial/ui';

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
 */
export function useBalance(accountId: string | null): UseBalanceReturn {
  const queryClient = useQueryClient();

  const {
    data: balance,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['balance', accountId],
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Account ID não disponível');
      }
      return getBalance(accountId);
    },
    enabled: !!accountId,
    staleTime: 0,
    retry: 1,
  });

  const formattedBalance = balance !== undefined ? formatCurrency(balance) : '';

  const refetch = React.useCallback(() => {
    if (accountId) {
      queryClient.invalidateQueries({ queryKey: ['balance', accountId] });
    }
  }, [accountId, queryClient]);

  return {
    balance,
    formattedBalance,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
