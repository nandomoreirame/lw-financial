import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9]+$/,
      'Username must contain only alphanumeric characters'
    ),
  pass: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginRequest = z.infer<typeof loginSchema>;
