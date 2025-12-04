import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import Fastify, { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { bankRoutes } from '../../src/bank/routes';
import { prisma } from '../../src/db/prisma';

describe('Bank Operations API Integration Tests', () => {
  let app: FastifyInstance;
  const TEST_SECRET = 'test-secret-key-min-32-characters-long-for-hs256';
  const originalSecret = process.env.BETTER_AUTH_SECRET;
  const TEST_USER_ID = 'test-user-123';
  const TEST_USERNAME = 'testuser';

  /**
   * Helper function to create a valid JWT token for testing
   */
  function createTestToken(
    userId: string = TEST_USER_ID,
    username: string = TEST_USERNAME
  ) {
    return jwt.sign(
      {
        userId,
        username,
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      },
      TEST_SECRET,
      { expiresIn: '1h' }
    );
  }

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET = TEST_SECRET;

    app = Fastify({ logger: false });
    await app.register(bankRoutes);
    await app.ready();
  });

  afterAll(async () => {
    if (originalSecret) {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    } else {
      delete process.env.BETTER_AUTH_SECRET;
    }
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany({});
    await prisma.bankAccount.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        accounts: {
          create: {
            accountId: TEST_USERNAME,
            providerId: 'credential',
            password: 'hashed-password',
          },
        },
      },
    });
  });

  describe('POST /reset', () => {
    test('should reset system state successfully', async () => {
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

      const account = await prisma.bankAccount.findUnique({
        where: { id: '100' },
      });
      expect(account).toBeTruthy();
      expect(Number(account?.balance)).toBe(10);
    });

    test('US-008: should deposit to existing account', async () => {
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

    test('should reject missing destination when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Authentication required');
    });

    test('should deposit to user default account when authenticated (no destination)', async () => {
      const token = createTestToken();

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'deposit',
          amount: 50.75,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('destination');
      expect(body.destination).toHaveProperty('id');
      expect(body.destination).toHaveProperty('balance');
      expect(body.destination.balance).toBe(50.75);

      const account = await prisma.bankAccount.findFirst({
        where: { userId: TEST_USER_ID },
      });
      expect(account).toBeTruthy();
      expect(Number(account?.balance)).toBe(50.75);
    });

    test('should deposit to existing user default account when authenticated', async () => {
      await prisma.bankAccount.create({
        data: {
          id: 'user-default-account',
          balance: 100,
          userId: TEST_USER_ID,
        },
      });

      const token = createTestToken();

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'deposit',
          amount: 25.5,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.destination.balance).toBe(125.5);
    });

    test('should validate amount range and precision for authenticated deposit', async () => {
      const token = createTestToken();

      const response1 = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'deposit',
          amount: 0.001,
        },
      });
      expect(response1.statusCode).toBe(400);

      const response2 = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'deposit',
          amount: 1000000,
        },
      });
      expect(response2.statusCode).toBe(400);

      const response3 = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'deposit',
          amount: 10.123,
        },
      });
      expect(response3.statusCode).toBe(400);
    });
  });

  describe('GET /balance', () => {
    test('US-005: should return balance for existing account', async () => {
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 20,
          userId: TEST_USER_ID,
        },
      });

      const token = createTestToken();

      const response = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(Number(response.body)).toBe(20);
    });

    test('US-006: should return 0 for non-existing account', async () => {
      const token = createTestToken();

      const response = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(Number(response.body)).toBe(0);
    });

    test('should reject missing authentication token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/balance',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Authentication required');
    });
  });

  describe('POST /event - withdraw', () => {
    test('US-009: should withdraw from existing account', async () => {
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

    test('should reject missing origin when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Authentication required');
    });

    test('should withdraw from user default account when authenticated (no origin)', async () => {
      await prisma.bankAccount.create({
        data: {
          id: 'user-default-account',
          balance: 100,
          userId: TEST_USER_ID,
        },
      });

      const token = createTestToken();

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'withdraw',
          amount: 30.25,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('origin');
      expect(body.origin).toHaveProperty('id');
      expect(body.origin).toHaveProperty('balance');
      expect(body.origin.balance).toBe(69.75);
    });

    test('should reject insufficient funds for authenticated withdraw', async () => {
      await prisma.bankAccount.create({
        data: {
          id: 'user-default-account',
          balance: 10,
          userId: TEST_USER_ID,
        },
      });

      const token = createTestToken();

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'withdraw',
          amount: 50,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Insufficient funds');
    });

    test('should create default account and allow withdraw when authenticated', async () => {
      const token = createTestToken();

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'withdraw',
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Insufficient funds');

      const account = await prisma.bankAccount.findFirst({
        where: { userId: TEST_USER_ID },
      });
      expect(account).toBeTruthy();
      expect(Number(account?.balance)).toBe(0);
    });

    test('should require authentication for deposit/withdraw without origin/destination', async () => {
      const depositResponse = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          amount: 10,
        },
      });
      expect(depositResponse.statusCode).toBe(401);

      const withdrawResponse = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          amount: 10,
        },
      });
      expect(withdrawResponse.statusCode).toBe(401);
    });
  });

  describe('POST /event - transfer', () => {
    test('US-012: should transfer between existing accounts', async () => {
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
      const token = createTestToken();

      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 100,
          userId: TEST_USER_ID,
        },
      });

      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: '100',
          amount: 0,
        },
      });

      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: '100',
          amount: 30,
        },
      });

      const balanceResponse = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      expect(balanceResponse.statusCode).toBe(200);
      expect(Number(balanceResponse.body)).toBe(70);

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

      const balance1 = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      expect(balance1.statusCode).toBe(200);
      expect(Number(balance1.body)).toBe(20);
    });

    test('should maintain data integrity after reset', async () => {
      await prisma.bankAccount.create({
        data: {
          id: '100',
          balance: 50,
          userId: TEST_USER_ID,
        },
      });

      await app.inject({
        method: 'POST',
        url: '/reset',
      });

      const token = createTestToken();
      const response = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      expect(response.statusCode).toBe(200);
      expect(Number(response.body)).toBe(0);
    });
  });
});
