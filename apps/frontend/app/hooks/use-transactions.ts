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
 * Optionally filters by accountCode if provided
 * Automatically invalidates cache after banking operations
 *
 * @param accountCode - Optional account code in format "XXXX-X" to filter transactions
 */
export function useTransactions(accountCode?: string): UseTransactionsReturn {
  const queryClient = useQueryClient();

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions', accountCode],
    queryFn: async () => {
      try {
        const result = await getTransactions(accountCode);
        if (import.meta.env.DEV) {
          console.log('[useTransactions] Fetched transactions:', {
            accountCode,
            result,
          });
        }
        return result;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[useTransactions] Error fetching transactions:', err);
        }
        throw err;
      }
    },
    staleTime: 0,
    retry: 1,
  });

  const refetch = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['transactions', accountCode],
    });
  }, [queryClient, accountCode]);

  return {
    transactions,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
