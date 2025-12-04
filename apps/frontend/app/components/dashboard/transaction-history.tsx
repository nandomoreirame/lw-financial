/**
 * Transaction history component for displaying recent transactions
 * Shows up to 20 transactions with type, amount, and date/time
 * Optionally filters by accountCode if provided
 */

import {
  cn,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  formatCurrency,
  formatDateTime,
  getTransactionTypeLabel,
} from '@lw-financial/ui';
import { ReceiptIcon } from 'lucide-react';
import * as React from 'react';
import { useTransactions } from '../../hooks/use-transactions';
import type { Transaction } from '../../lib/api';

export interface TransactionHistoryProps {
  accountCode?: string;
  accountId?: string;
}

/**
 * TransactionHistory component
 * Displays list of recent transactions with loading, error, and empty states
 * Optionally filters by accountCode if provided
 */
export function TransactionHistory({
  accountCode,
  accountId,
}: TransactionHistoryProps) {
  const { transactions, isLoading, error } = useTransactions(accountCode);

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
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            accountId={accountId}
          />
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
  accountId?: string;
  className?: string;
}

function TransactionItem({
  transaction,
  accountId,
  className,
}: TransactionItemProps) {
  let typeLabel = getTransactionTypeLabel(transaction.type);
  const formattedAmount = formatCurrency(Number(transaction.amount));
  const formattedDateTime = formatDateTime(transaction.createdAt);

  const isTransferSent =
    transaction.type === 'TRANSFER' &&
    accountId &&
    transaction.originAccountId === accountId;
  const isTransferReceived =
    transaction.type === 'TRANSFER' &&
    accountId &&
    transaction.destinationAccountId === accountId;

  if (isTransferSent) {
    typeLabel = 'Transferência Enviada';
  } else if (isTransferReceived) {
    typeLabel = 'Transferência Recebida';
  }

  const amountColor =
    transaction.type === 'DEPOSIT' ||
    transaction.type === 'INITIAL_BALANCE' ||
    isTransferReceived
      ? 'text-green-600 dark:text-green-400'
      : transaction.type === 'WITHDRAW' || isTransferSent
        ? 'text-red-600 dark:text-red-400'
        : 'text-blue-600 dark:text-blue-400';

  const amountWithSign =
    transaction.type === 'DEPOSIT' ||
    transaction.type === 'INITIAL_BALANCE' ||
    isTransferReceived
      ? `+${formattedAmount}`
      : transaction.type === 'WITHDRAW' || isTransferSent
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
