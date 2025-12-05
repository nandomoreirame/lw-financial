/**
 * Hook for transferring money using React Query mutations
 * Handles transfer operations, cache invalidation, and error states
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transfer, type TransferResponse } from '../lib/api';
import { isAuthenticationError, redirectToLogin } from '../lib/auth-redirect';

export interface UseTransferReturn {
  transfer: (
    destinationAccountCode: string,
    amount: number
  ) => Promise<TransferResponse>;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to transfer money between accounts
 * Automatically invalidates balance cache after successful transfer
 * Handles 401 errors by redirecting to login
 * @param originAccountCode - Origin account code in format "XXXX-X" (required)
 */
export function useTransfer(originAccountCode?: string): UseTransferReturn {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isSuccess, error, reset } = useMutation({
    mutationFn: (data: { destinationAccountCode: string; amount: number }) =>
      transfer(data.destinationAccountCode, data.amount, originAccountCode),
    onSuccess: () => {
      // Invalidate balance for both origin and destination accounts
      if (originAccountCode) {
        queryClient.invalidateQueries({
          queryKey: ['balance', originAccountCode],
        });
        queryClient.invalidateQueries({
          queryKey: ['transactions', originAccountCode],
        });
      }
      // Note: We don't know the destination account code here,
      // but the backend will handle cache invalidation for transactions
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
      });
    },
    onError: (error: Error) => {
      if (isAuthenticationError(error)) {
        redirectToLogin('Sua sessão expirou. Por favor, faça login novamente');
      }
    },
  });

  return {
    transfer: (destinationAccountCode: string, amount: number) =>
      mutateAsync({ destinationAccountCode, amount }),
    isLoading: isPending,
    isSuccess,
    error: error as Error | null,
    reset,
  };
}
