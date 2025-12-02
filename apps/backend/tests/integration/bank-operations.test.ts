import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import Fastify, { FastifyInstance } from 'fastify';
import { prisma } from '../../src/db/prisma';
import { bankRoutes } from '../../src/bank/routes';

describe('Bank Operations API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Initialize Fastify app
    app = Fastify({ logger: false });
    await app.register(bankRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.transaction.deleteMany({});
    await prisma.bankAccount.deleteMany({});
  });

  describe('POST /reset', () => {
    test('should reset system state successfully', async () => {
      // Create some test data
      await prisma.bankAccount.create({
        data: {
          id: 'test-account-1',
          balance: 100,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/reset',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('OK');

      // Verify all data is deleted
      const accountCount = await prisma.bankAccount.count();
      const transactionCount = await prisma.transaction.count();
      expect(accountCount).toBe(0);
      expect(transactionCount).toBe(0);
    });
  });

  describe('POST /event - deposit', () => {
    test('US-007: should create account with initial deposit', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: '100',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        destination: {
          id: '100',
          balance: 10,
        },
      });

      // Verify account was created in database
      const account = await prisma.bankAccount.findUnique({
        where: { id: '100' },
      });
      expect(account).toBeTruthy();
      expect(Number(account?.balance)).toBe(10);
    });

    test('US-008: should deposit to existing account', async () => {
      // Create initial account
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 10,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: '100',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        destination: {
          id: '100',
          balance: 20,
        },
      });
    });

    test('should reject invalid amount', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: '100',
          amount: -10,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject missing destination', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /balance', () => {
    test('US-005: should return balance for existing account', async () => {
      // Create account with balance
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 20,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/balance?account_id=100',
      });

      expect(response.statusCode).toBe(200);
      expect(Number(response.body)).toBe(20);
    });

    test('US-006: should return 0 for non-existing account', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/balance?account_id=999',
      });

      expect(response.statusCode).toBe(404);
      expect(Number(response.body)).toBe(0);
    });

    test('should reject missing account_id parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/balance',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /event - withdraw', () => {
    test('US-009: should withdraw from existing account', async () => {
      // Create account with balance
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 20,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: '100',
          amount: 5,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        origin: {
          id: '100',
          balance: 15,
        },
      });
    });

    test('US-010: should return 0 for non-existing account', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: '200',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(Number(response.body)).toBe(0);
    });

    test('US-011: should reject withdraw with insufficient funds', async () => {
      // Create account with insufficient balance
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 10,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: '100',
          amount: 20,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });

    test('should reject missing origin', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /event - transfer', () => {
    test('US-012: should transfer between existing accounts', async () => {
      // Create two accounts
      await prisma.bankAccount.createMany({
        data: [
          { id: '100', balance: 15 },
          { id: '300', balance: 0 },
        ],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: '100',
          destination: '300',
          amount: 15,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        origin: {
          id: '100',
          balance: 0,
        },
        destination: {
          id: '300',
          balance: 15,
        },
      });
    });

    test('should create destination account if it does not exist', async () => {
      // Create only origin account
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 15,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: '100',
          destination: '300',
          amount: 15,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        origin: {
          id: '100',
          balance: 0,
        },
        destination: {
          id: '300',
          balance: 15,
        },
      });

      // Verify destination account was created
      const destAccount = await prisma.bankAccount.findUnique({
        where: { id: '300' },
      });
      expect(destAccount).toBeTruthy();
      expect(Number(destAccount?.balance)).toBe(15);
    });

    test('US-013: should return 0 for non-existing origin account', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: '200',
          destination: '300',
          amount: 15,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(Number(response.body)).toBe(0);
    });

    test('US-014: should reject transfer with insufficient funds', async () => {
      // Create origin account with insufficient balance
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 10,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: '100',
          destination: '300',
          amount: 20,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });

    test('should reject transfer with same origin and destination', async () => {
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 15,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: '100',
          destination: '100',
          amount: 5,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject missing origin or destination', async () => {
      const response1 = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          destination: '300',
          amount: 15,
        },
      });

      expect(response1.statusCode).toBe(400);

      const response2 = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: '100',
          amount: 15,
        },
      });

      expect(response2.statusCode).toBe(400);
    });
  });

  describe('Complex scenarios', () => {
    test('should handle multiple operations in sequence', async () => {
      // 1. Create account with deposit
      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: '100',
          amount: 100,
        },
      });

      // 2. Withdraw some amount
      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: '100',
          amount: 30,
        },
      });

      // 3. Check balance
      const balanceResponse = await app.inject({
        method: 'GET',
        url: '/balance?account_id=100',
      });
      expect(Number(balanceResponse.body)).toBe(70);

      // 4. Transfer to new account
      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: '100',
          destination: '200',
          amount: 50,
        },
      });

      // 5. Verify final balances
      const balance1 = await app.inject({
        method: 'GET',
        url: '/balance?account_id=100',
      });
      expect(Number(balance1.body)).toBe(20);

      const balance2 = await app.inject({
        method: 'GET',
        url: '/balance?account_id=200',
      });
      expect(Number(balance2.body)).toBe(50);
    });

    test('should maintain data integrity after reset', async () => {
      // Create accounts and transactions
      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: '100',
          amount: 50,
        },
      });

      // Reset
      await app.inject({
        method: 'POST',
        url: '/reset',
      });

      // Verify all data is gone
      const response = await app.inject({
        method: 'GET',
        url: '/balance?account_id=100',
      });
      expect(response.statusCode).toBe(404);
      expect(Number(response.body)).toBe(0);
    });
  });
});
