/**
 * Skeleton loader component for balance card
 * Displays while balance information is being fetched
 */

import { cn } from '@lw-financial/ui';

export interface BalanceSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for balance card
 * Provides visual feedback during loading state
 */
export function BalanceSkeleton({ className }: BalanceSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 space-y-4 animate-pulse',
        className
      )}
    >
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-8 w-32 bg-muted rounded" />
      <div className="h-3 w-16 bg-muted rounded" />
    </div>
  );
}
