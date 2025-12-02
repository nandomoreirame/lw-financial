import { z } from 'zod';

// Example shared schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;

// Auth schemas
export { loginSchema, type LoginRequest } from './auth';

// Bank account schemas
export {
  createBankAccountSchema,
  updateBalanceSchema,
  createTransactionSchema,
  TransactionTypeEnum,
  type CreateBankAccountInput,
  type UpdateBalanceInput,
  type CreateTransactionInput,
  type TransactionType,
} from './bank-account';
