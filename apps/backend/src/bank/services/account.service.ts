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
 * Supports multiple accounts per user
 */
export class AccountService {
  /**
   * Gets all bank accounts for a user
   * @param userId - The user ID from the authenticated token
   * @returns Array of all bank accounts for the user
   */
  async getUserAccounts(userId: string): Promise<AccountBalance[]> {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map((account) => ({
      id: account.id,
      balance: Number(account.balance),
    }));
  }

  /**
   * Gets or creates the default bank account for a user
   * Returns the first account if multiple exist, or creates one if none exist
   * @param userId - The user ID from the authenticated token
   * @returns The default bank account for the user
   */
  async getOrCreateDefaultAccount(userId: string): Promise<{
    id: string;
    balance: number;
  }> {
    // Find existing accounts for this user
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }, // Get the first/oldest account as default
    });

    if (accounts.length > 0) {
      // Return the first account (default account)
      return {
        id: accounts[0].id,
        balance: Number(accounts[0].balance),
      };
    }

    // Create default account if none exists
    const newAccount = await prisma.bankAccount.create({
      data: {
        balance: new Prisma.Decimal(0),
        userId: userId,
      },
    });

    return {
      id: newAccount.id,
      balance: Number(newAccount.balance),
    };
  }

  /**
   * Gets the balance of the default bank account for a user
   * Creates a default account with balance 0 if it doesn't exist
   * @param userId - The user ID from the authenticated token
   * @returns The balance of the user's default account
   */
  async getBalanceByUserId(userId: string): Promise<number> {
    const account = await this.getOrCreateDefaultAccount(userId);
    return account.balance;
  }

  /**
   * Gets the balance of a bank account by account ID
   * @deprecated Use getBalanceByUserId instead for better security
   * Creates the account with balance 0 if it doesn't exist
   */
  async getBalance(accountId: string): Promise<number> {
    let account = await prisma.bankAccount.findUnique({
      where: { id: accountId },
    });

    // Create account with balance 0 if it doesn't exist
    if (!account) {
      account = await prisma.bankAccount.create({
        data: {
          id: accountId,
          balance: new Prisma.Decimal(0),
        },
      });
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
