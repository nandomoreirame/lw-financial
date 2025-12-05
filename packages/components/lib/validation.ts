/**
 * Validation schemas for forms using Zod
 * Shared validation rules for transaction amounts and other form fields
 */

import { z } from '@lw-financial/shared';

/**
 * Transaction amount validation schema
 * Validates amounts between R$ 0,01 and R$ 999.999,99 with 2 decimal places
 */
export const transactionAmountSchema = z
  .number({
    required_error: 'Valor é obrigatório',
    invalid_type_error: 'Valor deve ser um número',
  })
  .positive('Valor deve ser maior que zero')
  .min(0.01, 'Valor mínimo é R$ 0,01')
  .max(999999.99, 'Valor máximo é R$ 999.999,99')
  .refine(
    (value) => {
      const valueStr = value.toString();
      if (valueStr.includes('e') || valueStr.includes('E')) {
        return value >= 0.01 && value <= 999999.99;
      }
      const decimalPlaces = (valueStr.split('.')[1] || '').length;
      return decimalPlaces <= 2;
    },
    {
      message: 'Valor deve ter no máximo 2 casas decimais',
    }
  )
  .refine(
    (value) => {
      return Number.isFinite(value) && !Number.isNaN(value);
    },
    {
      message: 'Valor inválido',
    }
  );

/**
 * Deposit form schema
 */
export const depositFormSchema = z.object({
  amount: transactionAmountSchema,
});

export type DepositFormData = z.infer<typeof depositFormSchema>;

/**
 * Withdraw form schema
 */
export const withdrawFormSchema = z.object({
  amount: transactionAmountSchema,
});

export type WithdrawFormData = z.infer<typeof withdrawFormSchema>;

/**
 * Account code validation schema
 * Validates account code format: XXXX-X (4 digits, hyphen, 1 digit)
 */
export const accountCodeSchema = z
  .string({
    required_error: 'Código da conta é obrigatório',
    invalid_type_error: 'Código da conta deve ser uma string',
  })
  .min(1, 'Código da conta é obrigatório')
  .regex(/^\d{4}-\d$/, 'Formato inválido. Use o formato XXXX-X (ex: 1234-5)');

/**
 * Transfer form schema
 */
export const transferFormSchema = z.object({
  destinationAccountCode: accountCodeSchema,
  amount: transactionAmountSchema,
});

export type TransferFormData = z.infer<typeof transferFormSchema>;
