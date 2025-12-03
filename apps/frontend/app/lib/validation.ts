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
      // Check if value has at most 2 decimal places
      // Use a more robust method that handles scientific notation and large numbers
      const valueStr = value.toString();
      // Handle scientific notation (e.g., 1e-2)
      if (valueStr.includes('e') || valueStr.includes('E')) {
        // For scientific notation, check if the value is within valid range
        // and has reasonable precision
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
      // Check if value is a valid finite number
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
