import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../db/prisma';
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../email/sender';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_BASE_URL ||
    `http://localhost:${process.env.PORT || 3333}`,
  trustedOrigins: [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    `http://localhost:${process.env.PORT || 3333}`,
  ],
  email: {
    sendVerificationEmail: async ({
      user,
      url,
      token,
    }: {
      user: { email: string; name?: string | null };
      url: string;
      token: string;
    }) => {
      await sendVerificationEmail({ user, url, token });
    },
    sendPasswordResetEmail: async ({
      user,
      url,
      token,
    }: {
      user: { email: string; name?: string | null };
      url: string;
      token: string;
    }) => {
      await sendPasswordResetEmail({ user, url, token });
    },
    sendPasswordChangedEmail: async ({
      user,
    }: {
      user: { email: string; name?: string | null };
    }) => {
      await sendPasswordChangedEmail({ user });
    },
  },
});
