/**
 * Hook for withdrawing money using React Query mutations
 * Handles withdraw operations, cache invalidation, and error states
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { withdraw, type WithdrawResponse } from '../lib/api';

export interface UseWithdrawReturn {
  withdraw: (amount: number) => Promise<WithdrawResponse>;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to withdraw money from account
 * Automatically invalidates balance cache after successful withdrawal
 */
export function useWithdraw(accountId: string | null): UseWithdrawReturn {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isSuccess, error, reset } = useMutation({
    mutationFn: withdraw,
    onSuccess: () => {
      // Invalidate balance cache to refresh balance after withdrawal
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: ['balance', accountId] });
      }
    },
  });

  return {
    withdraw: mutateAsync,
    isLoading: isPending,
    isSuccess,
    error: error as Error | null,
    reset,
  };
}
