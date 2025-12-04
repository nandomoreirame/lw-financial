/**
 * Refresh button component for manual balance update
 */

import { Button } from '@lw-financial/ui';
import { cn } from '@lw-financial/ui';

export interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Button for manually refreshing balance
 * Provides on-demand balance updates
 */
export function RefreshButton({
  onRefresh,
  isLoading = false,
  className,
}: RefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
      className={cn('gap-2', className)}
      aria-label="Atualizar saldo"
    >
      <span
        className={cn('h-4 w-4 inline-block', isLoading && 'animate-spin')}
        aria-hidden="true"
      >
        ↻
      </span>
      {isLoading ? 'Atualizando...' : 'Atualizar'}
    </Button>
  );
}
