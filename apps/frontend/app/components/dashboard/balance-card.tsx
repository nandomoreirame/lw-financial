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
          'rounded-lg border border-destructive/20 bg-destructive/10 p-6 space-y-4',
          className
        )}
      >
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-destructive">
            Erro ao carregar saldo
          </h3>
          <p className="text-sm text-muted-foreground">
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
      <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Saldo</h3>
          <p className="text-sm text-muted-foreground">
            Saldo não disponível no momento
          </p>
        </div>
        <RefreshButton onRefresh={onRefresh} isLoading={isRefreshing} />
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Saldo</p>
            {accountCode && (
              <p className="text-xs text-muted-foreground">
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
