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
        'bg-card animate-pulse space-y-4 rounded-lg border p-6',
        className
      )}
    >
      <div className="bg-muted h-4 w-24 rounded" />
      <div className="bg-muted h-8 w-32 rounded" />
      <div className="bg-muted h-3 w-16 rounded" />
    </div>
  );
}
