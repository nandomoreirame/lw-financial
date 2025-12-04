import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;

export { loginSchema, type LoginRequest } from './auth';

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
