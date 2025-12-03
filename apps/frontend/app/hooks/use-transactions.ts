/**
 * Hook for fetching and managing transaction history using React Query
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { getTransactions, type Transaction } from '../lib/api';

export interface UseTransactionsReturn {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage transaction history
 * Automatically invalidates cache after banking operations
 */
export function useTransactions(): UseTransactionsReturn {
  const queryClient = useQueryClient();

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      try {
        const result = await getTransactions();
        // Log for debugging (only in development)
        if (import.meta.env.DEV) {
          console.log('[useTransactions] Fetched transactions:', result);
        }
        return result;
      } catch (err) {
        // Log error for debugging (only in development)
        if (import.meta.env.DEV) {
          console.error('[useTransactions] Error fetching transactions:', err);
        }
        throw err;
      }
    },
    staleTime: 0, // Always refetch to get latest transactions
    retry: 1,
  });

  const refetch = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [queryClient]);

  return {
    transactions,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
