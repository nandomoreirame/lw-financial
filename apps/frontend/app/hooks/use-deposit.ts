/**
 * Hook for depositing money using React Query mutations
 * Handles deposit operations, cache invalidation, and error states
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deposit, type DepositResponse } from '../lib/api';

export interface UseDepositReturn {
  deposit: (amount: number) => Promise<DepositResponse>;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to deposit money into account
 * Automatically invalidates balance cache after successful deposit
 */
export function useDeposit(accountId: string | null): UseDepositReturn {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isSuccess, error, reset } = useMutation({
    mutationFn: deposit,
    onSuccess: () => {
      // Invalidate balance cache to refresh balance after deposit
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: ['balance', accountId] });
      }
    },
  });

  return {
    deposit: mutateAsync,
    isLoading: isPending,
    isSuccess,
    error: error as Error | null,
    reset,
  };
}
