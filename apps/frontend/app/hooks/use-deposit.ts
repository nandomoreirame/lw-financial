/**
 * Hook for depositing money using React Query mutations
 * Handles deposit operations, cache invalidation, and error states
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deposit, type DepositResponse } from '../lib/api';
import { isAuthenticationError, redirectToLogin } from '../lib/auth-redirect';

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
 * Handles 401 errors by redirecting to login
 * @param accountId - Account ID (optional)
 * @param accountCode - Account code in format "XXXX-X" (optional, takes precedence over accountId)
 */
export function useDeposit(
  accountId: string | null,
  accountCode?: string
): UseDepositReturn {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isSuccess, error, reset } = useMutation({
    mutationFn: (amount: number) => deposit(amount, accountCode),
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
    deposit: mutateAsync,
    isLoading: isPending,
    isSuccess,
    error: error as Error | null,
    reset,
  };
}
