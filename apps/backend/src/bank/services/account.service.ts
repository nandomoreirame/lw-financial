import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { generateUniqueAccountCode } from './account-code.service';

/**
 * Represents an account balance response
 */
export interface AccountBalance {
  id: string;
  code: string | null;
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
   * Gets a bank account by its unique code
   * @param code - The account code in format "XXXX-X"
   * @param userId - The user ID to validate ownership
   * @returns The account balance if found and owned by user
   * @throws AccountNotFoundError if account not found or not owned by user
   */
  async getAccountByCode(
    code: string,
    userId: string
  ): Promise<AccountBalance> {
    const account = await prisma.bankAccount.findUnique({
      where: { code },
    });

    if (!account) {
      throw new AccountNotFoundError(`Account with code ${code} not found`);
    }

    if (account.userId !== userId) {
      throw new AccountNotFoundError(
        `Account with code ${code} not found or access denied`
      );
    }

    return {
      id: account.id,
      code: account.code,
      balance: Number(account.balance),
    };
  }

  /**
   * Gets account by code without validating ownership
   * Used for transfers where destination account may belong to another user
   * @param code - The account code in format "XXXX-X"
   * @returns The account balance if found
   * @throws AccountNotFoundError if account not found
   */
  async getAccountByCodeWithoutOwnership(
    code: string
  ): Promise<AccountBalance> {
    const account = await prisma.bankAccount.findUnique({
      where: { code },
    });

    if (!account) {
      throw new AccountNotFoundError(`Account with code ${code} not found`);
    }

    return {
      id: account.id,
      code: account.code,
      balance: Number(account.balance),
    };
  }

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
      code: account.code,
      balance: Number(account.balance),
    }));
  }

  /**
   * Creates a new bank account for a user
   * Always creates a new account with a unique code
   * @param userId - The user ID from the authenticated token
   * @param initialBalance - Optional initial balance (default: 0)
   * @returns The newly created bank account
   */
  async createAccount(
    userId: string,
    initialBalance: number = 0
  ): Promise<AccountBalance> {
    const newAccount = await prisma.$transaction(async (tx) => {
      const code = await generateUniqueAccountCode();
      return await tx.bankAccount.create({
        data: {
          balance: new Prisma.Decimal(initialBalance),
          userId: userId,
          code: code,
        },
      });
    });

    return {
      id: newAccount.id,
      code: newAccount.code,
      balance: Number(newAccount.balance),
    };
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
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (accounts.length > 0) {
      return {
        id: accounts[0].id,
        balance: Number(accounts[0].balance),
      };
    }

    const newAccount = await prisma.$transaction(async (tx) => {
      const code = await generateUniqueAccountCode();
      return await tx.bankAccount.create({
        data: {
          balance: new Prisma.Decimal(0),
          userId: userId,
          code: code,
        },
      });
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

    if (!account) {
      account = await prisma.$transaction(async (tx) => {
        const code = await generateUniqueAccountCode();
        return await tx.bankAccount.create({
          data: {
            id: accountId,
            balance: new Prisma.Decimal(0),
            code: code,
          },
        });
      });
    }

    return Number(account.balance);
  }

  /**
   * Creates a new account with an initial deposit or deposits to an existing account
   * @param destinationId - Account ID or account code
   * @param amount - Deposit amount
   * @param userId - Optional user ID for validation
   * @param accountCode - Optional account code (if provided, will lookup account by code)
   * @returns The account balance after the operation
   */
  async deposit(
    destinationId: string,
    amount: number,
    userId?: string,
    accountCode?: string
  ): Promise<AccountBalance> {
    if (accountCode) {
      if (!userId) {
        throw new AccountNotFoundError(
          'User ID required when using account code'
        );
      }
      const account = await this.getAccountByCode(accountCode, userId);
      return this.deposit(account.id, amount, userId);
    }
    const result = await prisma.$transaction(async (tx) => {
      let account = await tx.bankAccount.findUnique({
        where: { id: destinationId },
      });

      if (account) {
        account = await tx.bankAccount.update({
          where: { id: destinationId },
          data: {
            balance: new Prisma.Decimal(Number(account.balance) + amount),
          },
        });
      } else {
        const code = await generateUniqueAccountCode();
        account = await tx.bankAccount.create({
          data: {
            id: destinationId,
            balance: new Prisma.Decimal(amount),
            userId: userId,
            code: code,
          },
        });
      }

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
      code: result.code,
      balance: Number(result.balance),
    };
  }

  /**
   * Withdraws from an account
   * @param originId - Account ID or account code
   * @param amount - Withdraw amount
   * @param userId - Optional user ID for validation
   * @param accountCode - Optional account code (if provided, will lookup account by code)
   * @throws AccountNotFoundError if account doesn't exist
   * @throws InsufficientFundsError if balance is insufficient
   */
  async withdraw(
    originId: string,
    amount: number,
    userId?: string,
    accountCode?: string
  ): Promise<AccountBalance> {
    if (accountCode) {
      if (!userId) {
        throw new AccountNotFoundError(
          'User ID required when using account code'
        );
      }
      const account = await this.getAccountByCode(accountCode, userId);
      return this.withdraw(account.id, amount, userId);
    }
    const result = await prisma.$transaction(async (tx) => {
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

      const updatedAccount = await tx.bankAccount.update({
        where: { id: originId },
        data: {
          balance: new Prisma.Decimal(currentBalance - amount),
        },
      });

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
      code: result.code,
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

      let destAccount = await tx.bankAccount.findUnique({
        where: { id: destinationId },
      });

      if (!destAccount) {
        const code = await generateUniqueAccountCode();
        destAccount = await tx.bankAccount.create({
          data: {
            id: destinationId,
            balance: new Prisma.Decimal(0),
            code: code,
          },
        });
      }

      const updatedOrigin = await tx.bankAccount.update({
        where: { id: originId },
        data: {
          balance: new Prisma.Decimal(originBalance - amount),
        },
      });

      const updatedDest = await tx.bankAccount.update({
        where: { id: destinationId },
        data: {
          balance: new Prisma.Decimal(Number(destAccount.balance) + amount),
        },
      });

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
        code: result.updatedOrigin.code,
        balance: Number(result.updatedOrigin.balance),
      },
      destination: {
        id: result.updatedDest.id,
        code: result.updatedDest.code,
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
      await tx.transaction.deleteMany({});
      await tx.bankAccount.deleteMany({});
    });
  }
}

export const accountService = new AccountService();
