/**
 * Transaction history component for displaying recent transactions
 * Shows up to 20 transactions with type, amount, and date/time
 */

import * as React from 'react';
import { ReceiptIcon } from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeLabel,
} from '@lw-financial/ui';
import { useTransactions } from '../../hooks/use-transactions';
import { cn } from '@lw-financial/ui';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@lw-financial/ui';
import type { Transaction } from '../../lib/api';

/**
 * TransactionHistory component
 * Displays list of recent transactions with loading, error, and empty states
 */
export function TransactionHistory() {
  const { transactions, isLoading, error } = useTransactions();

  if (import.meta.env.DEV) {
    React.useEffect(() => {
      console.log('[TransactionHistory] State:', {
        isLoading,
        hasError: !!error,
        errorMessage: error?.message,
        transactionsCount: transactions?.length ?? 0,
        transactions: transactions,
      });
    }, [isLoading, error, transactions]);
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Histórico de Transações</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">
          Erro ao carregar histórico
        </h2>
        <p className="text-sm text-muted-foreground">
          {error.message ||
            'Erro ao buscar histórico de transações. Tente novamente.'}
        </p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Histórico de Transações</h2>
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhuma transação encontrada</EmptyTitle>
            <EmptyDescription>
              Suas transações aparecerão aqui quando você realizar depósitos,
              saques ou transferências.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Histórico de Transações</h2>
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual transaction item component
 */
interface TransactionItemProps {
  transaction: Transaction;
  className?: string;
}

function TransactionItem({ transaction, className }: TransactionItemProps) {
  const typeLabel = getTransactionTypeLabel(transaction.type);
  const formattedAmount = formatCurrency(Number(transaction.amount));
  const formattedDateTime = formatDateTime(transaction.createdAt);

  const amountColor =
    transaction.type === 'DEPOSIT' || transaction.type === 'INITIAL_BALANCE'
      ? 'text-green-600 dark:text-green-400'
      : transaction.type === 'WITHDRAW'
        ? 'text-red-600 dark:text-red-400'
        : 'text-blue-600 dark:text-blue-400';

  const amountWithSign =
    transaction.type === 'DEPOSIT' || transaction.type === 'INITIAL_BALANCE'
      ? `+${formattedAmount}`
      : transaction.type === 'WITHDRAW'
        ? `-${formattedAmount}`
        : formattedAmount;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border bg-background p-4',
        className
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{typeLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground">{formattedDateTime}</p>
      </div>
      <div className="text-right">
        <p className={cn('text-sm font-semibold', amountColor)}>
          {amountWithSign}
        </p>
      </div>
    </div>
  );
}
