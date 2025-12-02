import { z } from 'zod';

/**
 * Schema de validação para criação de conta bancária
 * Valida que o saldo inicial seja não-negativo
 */
export const createBankAccountSchema = z.object({
  balance: z
    .number()
    .nonnegative('Balance must be non-negative')
    .finite('Balance must be a finite number')
    .refine((val) => {
      // Garantir que o valor não exceda o limite do Decimal(10, 2)
      return val <= 99999999.99;
    }, 'Balance exceeds maximum allowed value (99,999,999.99)'),
  userId: z.string().cuid().optional(),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;

/**
 * Schema de validação para atualização de saldo
 */
export const updateBalanceSchema = z.object({
  balance: z
    .number()
    .nonnegative('Balance must be non-negative')
    .finite('Balance must be a finite number')
    .refine((val) => {
      return val <= 99999999.99;
    }, 'Balance exceeds maximum allowed value (99,999,999.99)'),
});

export type UpdateBalanceInput = z.infer<typeof updateBalanceSchema>;

/**
 * Enum para tipos de transação
 */
export const TransactionTypeEnum = z.enum(['DEPOSIT', 'WITHDRAW', 'TRANSFER']);

export type TransactionType = z.infer<typeof TransactionTypeEnum>;

/**
 * Schema de validação para criação de transação
 * Valida regras de negócio baseadas no tipo de transação
 */
export const createTransactionSchema = z
  .object({
    type: TransactionTypeEnum,
    amount: z
      .number()
      .positive('Amount must be greater than zero')
      .finite('Amount must be a finite number')
      .refine((val) => {
        return val <= 99999999.99;
      }, 'Amount exceeds maximum allowed value (99,999,999.99)'),
    originAccountId: z.string().cuid().optional(),
    destinationAccountId: z.string().cuid().optional(),
    userId: z.string().cuid().optional(),
  })
  .refine(
    (data) => {
      // DEPOSIT deve ter destinationAccountId e não ter originAccountId
      if (data.type === 'DEPOSIT') {
        return (
          data.destinationAccountId !== undefined &&
          data.originAccountId === undefined
        );
      }
      return true;
    },
    {
      message:
        'DEPOSIT transactions must have destinationAccountId and no originAccountId',
      path: ['destinationAccountId'],
    }
  )
  .refine(
    (data) => {
      // WITHDRAW deve ter originAccountId e não ter destinationAccountId
      if (data.type === 'WITHDRAW') {
        return (
          data.originAccountId !== undefined &&
          data.destinationAccountId === undefined
        );
      }
      return true;
    },
    {
      message:
        'WITHDRAW transactions must have originAccountId and no destinationAccountId',
      path: ['originAccountId'],
    }
  )
  .refine(
    (data) => {
      // TRANSFER deve ter ambos originAccountId e destinationAccountId
      if (data.type === 'TRANSFER') {
        return (
          data.originAccountId !== undefined &&
          data.destinationAccountId !== undefined &&
          data.originAccountId !== data.destinationAccountId
        );
      }
      return true;
    },
    {
      message:
        'TRANSFER transactions must have both originAccountId and destinationAccountId, and they must be different',
      path: ['originAccountId'],
    }
  );

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
