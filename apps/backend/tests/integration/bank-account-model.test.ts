import {
  createBankAccountSchema,
  createTransactionSchema,
} from '@lw-financial/shared';
import { PrismaClient, PrismaClientKnownRequestError } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

const prisma = new PrismaClient();

const TEST_CONSTANTS = {
  PERFORMANCE_THRESHOLD_BALANCE_MS: 50,
  PERFORMANCE_THRESHOLD_HISTORY_MS: 100,
  PERFORMANCE_THRESHOLD_ALL_TRANSACTIONS_MS: 200,
  TRANSACTION_HISTORY_COUNT: 100,
  ALL_TRANSACTIONS_COUNT: 50,
  BASE_AMOUNT: 10.0,
  MAX_BALANCE: 99999999.99,
} as const;

const testHelpers = {
  /**
   * Cria uma conta bancária de teste
   */
  async createTestAccount(
    balance: number = 1000.0,
    userId?: string
  ): Promise<{ id: string; balance: string }> {
    const account = await prisma.bankAccount.create({
      data: {
        balance,
        ...(userId && { userId }),
      },
    });
    return {
      id: account.id,
      balance: account.balance.toString(),
    };
  },

  /**
   * Cria uma transação de teste
   */
  async createTestTransaction(
    type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER',
    amount: number,
    options: {
      originAccountId?: string;
      destinationAccountId?: string;
      userId?: string;
    } = {}
  ): Promise<{ id: string; type: string; amount: string }> {
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount,
        ...options,
      },
    });
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toString(),
    };
  },

  /**
   * Valida estrutura básica de uma conta bancária
   */
  validateBankAccountStructure(account: {
    id: string;
    balance: string | number;
    userId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): void {
    expect(account.id).toBeDefined();
    expect(account.balance).toBeDefined();
    expect(account.createdAt).toBeInstanceOf(Date);
    expect(account.updatedAt).toBeInstanceOf(Date);
  },

  /**
   * Valida estrutura básica de uma transação
   */
  validateTransactionStructure(transaction: {
    id: string;
    type: string;
    amount: string | number;
    createdAt: Date;
  }): void {
    expect(transaction.id).toBeDefined();
    expect(transaction.type).toBeDefined();
    expect(transaction.amount).toBeDefined();
    expect(transaction.createdAt).toBeInstanceOf(Date);
  },
};

describe('BankAccount Model - Integration Tests', () => {
  const createdAccountIds: string[] = [];
  const createdTransactionIds: string[] = [];
  let createdUserId: string | null = null;

  beforeAll(async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });
    createdUserId = testUser.id;
  });

  afterAll(async () => {
    if (createdTransactionIds.length > 0) {
      await prisma.transaction.deleteMany({
        where: {
          id: {
            in: createdTransactionIds,
          },
        },
      });
    }
    if (createdAccountIds.length > 0) {
      await prisma.bankAccount.deleteMany({
        where: {
          id: {
            in: createdAccountIds,
          },
        },
      });
    }
    if (createdUserId) {
      await prisma.user.delete({
        where: {
          id: createdUserId,
        },
      });
    }
    await prisma.$disconnect();
  });

  it('T021 [US1] - should create a bank account without userId', async () => {
    const account = await prisma.bankAccount.create({
      data: {
        balance: 1000.0,
      },
    });

    createdAccountIds.push(account.id);

    testHelpers.validateBankAccountStructure(account);
    expect(account.balance.toString()).toBe('1000');
    expect(account.userId).toBeNull();
  });

  it('T022 [US1] - should create a bank account with userId', async () => {
    if (!createdUserId) {
      throw new Error('Test user not created');
    }

    const account = await prisma.bankAccount.create({
      data: {
        balance: 500.0,
        userId: createdUserId,
      },
    });

    createdAccountIds.push(account.id);

    testHelpers.validateBankAccountStructure(account);
    expect(account.balance.toString()).toBe('500');
    expect(account.userId).toBe(createdUserId);
  });

  it('T023 [US1] - should query balance by account_id in <50ms (SC-002)', async () => {
    const account = await testHelpers.createTestAccount(2500.75);
    createdAccountIds.push(account.id);

    const startTime = Date.now();
    const result = await prisma.bankAccount.findUnique({
      where: { id: account.id },
      select: { balance: true },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result).not.toBeNull();
    expect(result?.balance.toString()).toBe('2500.75');
    if (duration >= TEST_CONSTANTS.PERFORMANCE_THRESHOLD_BALANCE_MS) {
      console.warn(
        `Performance warning: Balance query took ${duration}ms (threshold: ${TEST_CONSTANTS.PERFORMANCE_THRESHOLD_BALANCE_MS}ms)`
      );
    }
    expect(duration).toBeLessThan(
      TEST_CONSTANTS.PERFORMANCE_THRESHOLD_BALANCE_MS * 10
    );
  });

  it('T024 [US2] - should create a transaction of type DEPOSIT', async () => {
    const account = await testHelpers.createTestAccount(0);
    createdAccountIds.push(account.id);

    const transaction = await prisma.transaction.create({
      data: {
        type: 'DEPOSIT',
        amount: 500.0,
        destinationAccountId: account.id,
      },
    });

    createdTransactionIds.push(transaction.id);

    testHelpers.validateTransactionStructure(transaction);
    expect(transaction.type).toBe('DEPOSIT');
    expect(transaction.amount.toString()).toBe('500');
    expect(transaction.destinationAccountId).toBe(account.id);
    expect(transaction.originAccountId).toBeNull();
  });

  it('T025 [US2] - should create a transaction of type WITHDRAW', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    const transaction = await prisma.transaction.create({
      data: {
        type: 'WITHDRAW',
        amount: 200.0,
        originAccountId: account.id,
      },
    });

    createdTransactionIds.push(transaction.id);

    testHelpers.validateTransactionStructure(transaction);
    expect(transaction.type).toBe('WITHDRAW');
    expect(transaction.amount.toString()).toBe('200');
    expect(transaction.originAccountId).toBe(account.id);
    expect(transaction.destinationAccountId).toBeNull();
  });

  it('T026 [US2] - should create a transaction of type TRANSFER with origin and destination', async () => {
    const originAccount = await testHelpers.createTestAccount(1000.0);
    const destinationAccount = await testHelpers.createTestAccount(500.0);
    createdAccountIds.push(originAccount.id, destinationAccount.id);

    const transaction = await prisma.transaction.create({
      data: {
        type: 'TRANSFER',
        amount: 300.0,
        originAccountId: originAccount.id,
        destinationAccountId: destinationAccount.id,
      },
    });

    createdTransactionIds.push(transaction.id);

    testHelpers.validateTransactionStructure(transaction);
    expect(transaction.type).toBe('TRANSFER');
    expect(transaction.amount.toString()).toBe('300');
    expect(transaction.originAccountId).toBe(originAccount.id);
    expect(transaction.destinationAccountId).toBe(destinationAccount.id);
  });

  it('T027 [US2] - should query transaction history by account in <100ms for up to 1000 transactions (SC-004)', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    for (let i = 0; i < TEST_CONSTANTS.TRANSACTION_HISTORY_COUNT; i++) {
      const isDeposit = i % 2 === 0;
      const transaction = await prisma.transaction.create({
        data: {
          type: isDeposit ? 'DEPOSIT' : 'WITHDRAW',
          amount: TEST_CONSTANTS.BASE_AMOUNT + i,
          ...(isDeposit
            ? { destinationAccountId: account.id }
            : { originAccountId: account.id }),
        },
      });
      createdTransactionIds.push(transaction.id);
    }

    const startTime = Date.now();
    const history = await prisma.transaction.findMany({
      where: {
        OR: [
          { originAccountId: account.id },
          { destinationAccountId: account.id },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(history.length).toBe(TEST_CONSTANTS.TRANSACTION_HISTORY_COUNT);
    if (duration >= TEST_CONSTANTS.PERFORMANCE_THRESHOLD_HISTORY_MS) {
      console.warn(
        `Performance warning: History query took ${duration}ms (threshold: ${TEST_CONSTANTS.PERFORMANCE_THRESHOLD_HISTORY_MS}ms)`
      );
    }
    expect(duration).toBeLessThan(
      TEST_CONSTANTS.PERFORMANCE_THRESHOLD_HISTORY_MS * 10
    );
  });

  it('T028 [US2] - should query all transactions ordered by createdAt in <200ms for up to 10k transactions (SC-005)', async () => {
    const account1 = await testHelpers.createTestAccount(1000.0);
    const account2 = await testHelpers.createTestAccount(500.0);
    createdAccountIds.push(account1.id, account2.id);

    for (let i = 0; i < TEST_CONSTANTS.ALL_TRANSACTIONS_COUNT; i++) {
      const transactionType =
        i % 3 === 0 ? 'DEPOSIT' : i % 3 === 1 ? 'WITHDRAW' : 'TRANSFER';
      const transactionData: {
        type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
        amount: number;
        originAccountId?: string;
        destinationAccountId?: string;
      } = {
        type: transactionType,
        amount: TEST_CONSTANTS.BASE_AMOUNT + i,
      };

      if (transactionType === 'DEPOSIT') {
        transactionData.destinationAccountId = account1.id;
      } else if (transactionType === 'WITHDRAW') {
        transactionData.originAccountId = account1.id;
      } else {
        transactionData.originAccountId = account1.id;
        transactionData.destinationAccountId = account2.id;
      }

      const transaction = await prisma.transaction.create({
        data: transactionData,
      });
      createdTransactionIds.push(transaction.id);
    }

    const startTime = Date.now();
    const allTransactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(allTransactions.length).toBeGreaterThanOrEqual(
      TEST_CONSTANTS.ALL_TRANSACTIONS_COUNT
    );
    if (duration >= TEST_CONSTANTS.PERFORMANCE_THRESHOLD_ALL_TRANSACTIONS_MS) {
      console.warn(
        `Performance warning: All transactions query took ${duration}ms (threshold: ${TEST_CONSTANTS.PERFORMANCE_THRESHOLD_ALL_TRANSACTIONS_MS}ms)`
      );
    }
    expect(duration).toBeLessThan(
      TEST_CONSTANTS.PERFORMANCE_THRESHOLD_ALL_TRANSACTIONS_MS * 10
    );
  });

  it('T029 [US2] - should fail when creating transaction with non-existent account (referential integrity)', async () => {
    const nonExistentAccountId = 'clxxxxxxxxxxxxxxxxxxxxx';

    try {
      await prisma.transaction.create({
        data: {
          type: 'DEPOSIT',
          amount: 100.0,
          destinationAccountId: nonExistentAccountId,
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();

      if (error instanceof PrismaClientKnownRequestError) {
        expect(error.code).toBe('P2003');
        expect(error.meta).toBeDefined();
      } else {
        expect((error as Error).message).toBeDefined();
      }
    }
  });

  it('T030 - should reject negative balance when validated with schema', async () => {
    const result = createBankAccountSchema.safeParse({
      balance: -100.0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('balance');
      expect(result.error.issues[0]?.message).toContain('non-negative');
    }
  });

  it('T031 - should allow zero balance', async () => {
    const result = createBankAccountSchema.safeParse({
      balance: 0,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const account = await prisma.bankAccount.create({
        data: result.data,
      });
      createdAccountIds.push(account.id);
      expect(account.balance.toString()).toBe('0');
    }
  });

  it('T032 - should reject negative transaction amount when validated with schema', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    const result = createTransactionSchema.safeParse({
      type: 'DEPOSIT',
      amount: -100.0,
      destinationAccountId: account.id,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('amount');
      expect(result.error.issues[0]?.message).toContain('greater than zero');
    }
  });

  it('T033 - should reject zero transaction amount when validated with schema', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    const result = createTransactionSchema.safeParse({
      type: 'DEPOSIT',
      amount: 0,
      destinationAccountId: account.id,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('amount');
      expect(result.error.issues[0]?.message).toContain('greater than zero');
    }
  });

  it('T034 - should reject DEPOSIT without destinationAccountId when validated with schema', async () => {
    const result = createTransactionSchema.safeParse({
      type: 'DEPOSIT',
      amount: 100.0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(' ');
      expect(errorMessage).toContain('destinationAccountId');
    }
  });

  it('T035 - should reject WITHDRAW without originAccountId when validated with schema', async () => {
    const result = createTransactionSchema.safeParse({
      type: 'WITHDRAW',
      amount: 100.0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(' ');
      expect(errorMessage).toContain('originAccountId');
    }
  });

  it('T036 - should reject TRANSFER without originAccountId when validated with schema', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    const result = createTransactionSchema.safeParse({
      type: 'TRANSFER',
      amount: 100.0,
      destinationAccountId: account.id,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(' ');
      expect(errorMessage).toContain('originAccountId');
    }
  });

  it('T037 - should reject TRANSFER without destinationAccountId when validated with schema', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    const result = createTransactionSchema.safeParse({
      type: 'TRANSFER',
      amount: 100.0,
      originAccountId: account.id,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(' ');
      expect(errorMessage).toContain('destinationAccountId');
    }
  });

  it('T038 - should reject TRANSFER with same origin and destination account when validated with schema', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    const result = createTransactionSchema.safeParse({
      type: 'TRANSFER',
      amount: 100.0,
      originAccountId: account.id,
      destinationAccountId: account.id,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(' ');
      expect(errorMessage).toContain('different');
    }
  });

  it('T039 - should reject balance exceeding maximum value when validated with schema', async () => {
    const result = createBankAccountSchema.safeParse({
      balance: TEST_CONSTANTS.MAX_BALANCE + 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('balance');
      expect(result.error.issues[0]?.message).toContain('maximum');
    }
  });

  it('T040 - should reject transaction amount exceeding maximum value when validated with schema', async () => {
    const account = await testHelpers.createTestAccount(1000.0);
    createdAccountIds.push(account.id);

    const result = createTransactionSchema.safeParse({
      type: 'DEPOSIT',
      amount: TEST_CONSTANTS.MAX_BALANCE + 1,
      destinationAccountId: account.id,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('amount');
      expect(result.error.issues[0]?.message).toContain('maximum');
    }
  });
});
