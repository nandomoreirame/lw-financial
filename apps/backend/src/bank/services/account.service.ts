import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';

/**
 * Represents an account balance response
 */
export interface AccountBalance {
  id: string;
  balance: number;
}

/**
 * Error thrown when an account is not found
 */
export class AccountNotFoundError extends Error {
  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
    this.name = 'AccountNotFoundError';
  }
}

/**
 * Error thrown when there's insufficient funds for an operation
 */
export class InsufficientFundsError extends Error {
  constructor(accountId: string, requested: number, available: number) {
    super(
      `Insufficient funds in account ${accountId}: requested ${requested}, available ${available}`
    );
    this.name = 'InsufficientFundsError';
  }
}

/**
 * Bank Account Service
 * Handles all business logic for bank account operations
 */
export class AccountService {
  /**
   * Gets the balance of a bank account
   * @throws AccountNotFoundError if account doesn't exist
   */
  async getBalance(accountId: string): Promise<number> {
    const account = await prisma.bankAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    return Number(account.balance);
  }

  /**
   * Creates a new account with an initial deposit or deposits to an existing account
   * @returns The account balance after the operation
   */
  async deposit(
    destinationId: string,
    amount: number,
    userId?: string
  ): Promise<AccountBalance> {
    const result = await prisma.$transaction(async (tx) => {
      // Try to find existing account
      let account = await tx.bankAccount.findUnique({
        where: { id: destinationId },
      });

      if (account) {
        // Update existing account balance
        account = await tx.bankAccount.update({
          where: { id: destinationId },
          data: {
            balance: new Prisma.Decimal(Number(account.balance) + amount),
          },
        });
      } else {
        // Create new account with initial balance
        account = await tx.bankAccount.create({
          data: {
            id: destinationId,
            balance: new Prisma.Decimal(amount),
            userId: userId,
          },
        });
      }

      // Record the transaction
      await tx.transaction.create({
        data: {
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(amount),
          destinationAccountId: account.id,
          userId: userId,
        },
      });

      return account;
    });

    return {
      id: result.id,
      balance: Number(result.balance),
    };
  }

  /**
   * Withdraws from an account
   * @throws AccountNotFoundError if account doesn't exist
   * @throws InsufficientFundsError if balance is insufficient
   */
  async withdraw(
    originId: string,
    amount: number,
    userId?: string
  ): Promise<AccountBalance> {
    const result = await prisma.$transaction(async (tx) => {
      // Find the account
      const account = await tx.bankAccount.findUnique({
        where: { id: originId },
      });

      if (!account) {
        throw new AccountNotFoundError(originId);
      }

      const currentBalance = Number(account.balance);
      if (currentBalance < amount) {
        throw new InsufficientFundsError(originId, amount, currentBalance);
      }

      // Update balance
      const updatedAccount = await tx.bankAccount.update({
        where: { id: originId },
        data: {
          balance: new Prisma.Decimal(currentBalance - amount),
        },
      });

      // Record the transaction
      await tx.transaction.create({
        data: {
          type: 'WITHDRAW',
          amount: new Prisma.Decimal(amount),
          originAccountId: originId,
          userId: userId,
        },
      });

      return updatedAccount;
    });

    return {
      id: result.id,
      balance: Number(result.balance),
    };
  }

  /**
   * Transfers between two accounts
   * @throws AccountNotFoundError if origin account doesn't exist
   * @throws InsufficientFundsError if origin balance is insufficient
   */
  async transfer(
    originId: string,
    destinationId: string,
    amount: number,
    userId?: string
  ): Promise<{ origin: AccountBalance; destination: AccountBalance }> {
    const result = await prisma.$transaction(async (tx) => {
      // Find origin account
      const originAccount = await tx.bankAccount.findUnique({
        where: { id: originId },
      });

      if (!originAccount) {
        throw new AccountNotFoundError(originId);
      }

      const originBalance = Number(originAccount.balance);
      if (originBalance < amount) {
        throw new InsufficientFundsError(originId, amount, originBalance);
      }

      // Find or create destination account
      let destAccount = await tx.bankAccount.findUnique({
        where: { id: destinationId },
      });

      if (!destAccount) {
        // Create destination account if it doesn't exist
        destAccount = await tx.bankAccount.create({
          data: {
            id: destinationId,
            balance: new Prisma.Decimal(0),
          },
        });
      }

      // Update origin account (debit)
      const updatedOrigin = await tx.bankAccount.update({
        where: { id: originId },
        data: {
          balance: new Prisma.Decimal(originBalance - amount),
        },
      });

      // Update destination account (credit)
      const updatedDest = await tx.bankAccount.update({
        where: { id: destinationId },
        data: {
          balance: new Prisma.Decimal(Number(destAccount.balance) + amount),
        },
      });

      // Record the transaction
      await tx.transaction.create({
        data: {
          type: 'TRANSFER',
          amount: new Prisma.Decimal(amount),
          originAccountId: originId,
          destinationAccountId: destinationId,
          userId: userId,
        },
      });

      return { updatedOrigin, updatedDest };
    });

    return {
      origin: {
        id: result.updatedOrigin.id,
        balance: Number(result.updatedOrigin.balance),
      },
      destination: {
        id: result.updatedDest.id,
        balance: Number(result.updatedDest.balance),
      },
    };
  }

  /**
   * Resets all bank accounts and transactions
   * Warning: This deletes all data!
   */
  async reset(): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Delete all transactions first (due to foreign key constraints)
      await tx.transaction.deleteMany({});
      // Delete all bank accounts
      await tx.bankAccount.deleteMany({});
    });
  }
}

// Export singleton instance
export const accountService = new AccountService();
