/**
 * Balance card component for displaying account balance
 * Shows formatted balance, loading state, and error states
 */

import { cn } from '@lw-financial/ui';
import { BalanceSkeleton } from './balance-skeleton';
import { RefreshButton } from './refresh-button';

export interface BalanceCardProps {
  balance: number | undefined;
  formattedBalance: string;
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
  accountCode?: string;
  className?: string;
}

/**
 * Card component for displaying account balance
 * Handles loading, error, and empty states
 */
export function BalanceCard({
  balance,
  formattedBalance,
  isLoading,
  error,
  onRefresh,
  isRefreshing = false,
  accountCode,
  className,
}: BalanceCardProps) {
  if (isLoading && balance === undefined) {
    return <BalanceSkeleton className={className} />;
  }

  if (error) {
    return (
      <div
        className={cn(
          'border-destructive/20 bg-destructive/10 space-y-4 rounded-lg border p-6',
          className
        )}
      >
        <div className="space-y-2">
          <h3 className="text-destructive text-sm font-medium">
            Erro ao carregar saldo
          </h3>
          <p className="text-muted-foreground text-sm">
            {error.message ||
              'Erro ao buscar informações de saldo. Tente novamente.'}
          </p>
        </div>
        <RefreshButton onRefresh={onRefresh} isLoading={isRefreshing} />
      </div>
    );
  }

  if (balance === undefined || balance === null) {
    return (
      <div className={cn('bg-card space-y-4 rounded-lg border p-6', className)}>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Saldo</h3>
          <p className="text-muted-foreground text-sm">
            Saldo não disponível no momento
          </p>
        </div>
        <RefreshButton onRefresh={onRefresh} isLoading={isRefreshing} />
      </div>
    );
  }

  return (
    <div className={cn('bg-card space-y-4 rounded-lg border p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm font-medium">Saldo</p>
            {accountCode && (
              <p className="text-muted-foreground text-xs">
                Conta {accountCode}
              </p>
            )}
          </div>
          <p className="text-3xl font-bold">{formattedBalance}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} isLoading={isRefreshing} />
      </div>
    </div>
  );
}
