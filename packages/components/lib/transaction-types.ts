/**
 * Transaction type utilities and constants
 */

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER'
  | 'INITIAL_BALANCE';

/**
 * Maps transaction type enum to Portuguese labels
 * @param type - Transaction type (DEPOSIT, WITHDRAW, TRANSFER, INITIAL_BALANCE)
 * @returns Portuguese label for the transaction type
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    DEPOSIT: 'Depósito',
    WITHDRAW: 'Saque',
    TRANSFER: 'Transferência',
    INITIAL_BALANCE: 'Saldo Inicial',
  };

  return labels[type] || type;
}

/**
 * Array of all transaction types
 */
export const TRANSACTION_TYPES: TransactionType[] = [
  'DEPOSIT',
  'WITHDRAW',
  'TRANSFER',
  'INITIAL_BALANCE',
];
