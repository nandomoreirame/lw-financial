/**
 * Hook for withdrawing money using React Query mutations
 * Handles withdraw operations, cache invalidation, and error states
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { withdraw, type WithdrawResponse } from '../lib/api';
import { isAuthenticationError, redirectToLogin } from '../lib/auth-redirect';

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
 * Handles 401 errors by redirecting to login
 * @param accountId - Account ID (optional)
 * @param accountCode - Account code in format "XXXX-X" (optional, takes precedence over accountId)
 */
export function useWithdraw(
  accountId: string | null,
  accountCode?: string
): UseWithdrawReturn {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isSuccess, error, reset } = useMutation({
    mutationFn: (amount: number) => withdraw(amount, accountCode),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['balance', accountCode || 'default'],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', accountCode],
      });
    },
    onError: (error: Error) => {
      if (isAuthenticationError(error)) {
        redirectToLogin('Sua sessão expirou. Por favor, faça login novamente');
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
