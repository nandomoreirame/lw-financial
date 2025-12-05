import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import Fastify, { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { bankRoutes } from '../../src/bank/routes';
import { prisma } from '../../src/db/prisma';

describe('Bank Operations API Integration Tests', () => {
  let app: FastifyInstance;
  const TEST_SECRET = 'test-secret-key-min-32-characters-long-for-hs256';
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  /**
   * Helper function to create a test user and return its ID
   */
  async function createTestUser(): Promise<string> {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test User',
        emailVerified: true,
        accounts: {
          create: {
            accountId: `testuser-${Date.now()}-${Math.random()}`,
            providerId: 'credential',
            password: 'hashed-password',
          },
        },
      },
    });
    return user.id;
  }

  /**
   * Helper function to create a valid JWT token for testing
   */
  function createTestToken(userId: string, username?: string) {
    return jwt.sign(
      {
        userId,
        username: username || `testuser-${Date.now()}`,
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

  describe('POST /reset', () => {
    test('should reject reset without authentication token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/reset',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Authentication required');
    });

    test('should reject reset with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/reset',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });

    test('should reset system state successfully with valid token', async () => {
      const userId = await createTestUser();
      const token = createTestToken(userId);

      const testAccountId = `test-account-reset-${Date.now()}`;
      await prisma.bankAccount.create({
        data: {
          id: testAccountId,
          balance: 100,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/reset',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('OK');

      const accountCount = await prisma.bankAccount.count();
      const transactionCount = await prisma.transaction.count();
      expect(accountCount).toBe(0);
      expect(transactionCount).toBe(0);

      await prisma.user.delete({ where: { id: userId } });
    });
  });

  describe('POST /event - deposit', () => {
    test('US-007: should create account with initial deposit', async () => {
      const accountId = `account-${Date.now()}-${Math.random()}`;
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: accountId,
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        destination: {
          id: accountId,
          balance: 10,
        },
      });

      const account = await prisma.bankAccount.findUnique({
        where: { id: accountId },
      });
      expect(account).toBeTruthy();
      expect(Number(account?.balance)).toBe(10);

      await prisma.bankAccount.delete({ where: { id: accountId } });
    });

    test('US-008: should deposit to existing account', async () => {
      const accountId = `account-${Date.now()}-${Math.random()}`;
      await prisma.bankAccount.create({
        data: {
          id: accountId,
          balance: 10,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: accountId,
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        destination: {
          id: accountId,
          balance: 20,
        },
      });

      await prisma.bankAccount.delete({ where: { id: accountId } });
    });

    test('should reject invalid amount', async () => {
      const accountId = `account-${Date.now()}-${Math.random()}`;
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: accountId,
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
      const userId = await createTestUser();
      const token = createTestToken(userId);

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
        where: { userId },
      });
      expect(account).toBeTruthy();
      expect(Number(account?.balance)).toBe(50.75);

      await prisma.bankAccount.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    test('should deposit to existing user default account when authenticated', async () => {
      const userId = await createTestUser();
      await prisma.bankAccount.create({
        data: {
          id: `user-default-account-${Date.now()}`,
          balance: 100,
          userId,
        },
      });

      const token = createTestToken(userId);

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

      await prisma.bankAccount.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    test('should validate amount range and precision for authenticated deposit', async () => {
      const userId = await createTestUser();
      const token = createTestToken(userId);

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

      await prisma.user.delete({ where: { id: userId } });
    });
  });

  describe('GET /balance', () => {
    test('US-005: should return balance for existing account', async () => {
      const userId = await createTestUser();
      await prisma.bankAccount.create({
        data: {
          id: `account-${Date.now()}`,
          balance: 20,
          userId,
        },
      });

      const token = createTestToken(userId);

      const response = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(Number(response.body)).toBe(20);

      await prisma.bankAccount.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    test('US-006: should return 0 for non-existing account', async () => {
      const userId = await createTestUser();
      const token = createTestToken(userId);

      const response = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(Number(response.body)).toBe(0);

      await prisma.user.delete({ where: { id: userId } });
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
      const accountId = `account-${Date.now()}-${Math.random()}`;
      await prisma.bankAccount.create({
        data: {
          id: accountId,
          balance: 20,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: accountId,
          amount: 5,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        origin: {
          id: accountId,
          balance: 15,
        },
      });

      await prisma.bankAccount.delete({ where: { id: accountId } });
    });

    test('US-010: should return 0 for non-existing account', async () => {
      const accountId = `account-nonexistent-${Date.now()}-${Math.random()}`;
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: accountId,
          amount: 10,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(Number(response.body)).toBe(0);
    });

    test('US-011: should reject withdraw with insufficient funds', async () => {
      const accountId = `account-${Date.now()}-${Math.random()}`;
      await prisma.bankAccount.create({
        data: {
          id: accountId,
          balance: 10,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: accountId,
          amount: 20,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');

      await prisma.bankAccount.delete({ where: { id: accountId } });
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
      const userId = await createTestUser();
      await prisma.bankAccount.create({
        data: {
          id: `user-default-account-${Date.now()}`,
          balance: 100,
          userId,
        },
      });

      const token = createTestToken(userId);

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

      await prisma.bankAccount.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    test('should reject insufficient funds for authenticated withdraw', async () => {
      const userId = await createTestUser();
      await prisma.bankAccount.create({
        data: {
          id: `user-default-account-${Date.now()}`,
          balance: 10,
          userId,
        },
      });

      const token = createTestToken(userId);

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

      await prisma.bankAccount.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    test('should create default account and allow withdraw when authenticated', async () => {
      const userId = await createTestUser();
      const token = createTestToken(userId);

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
        where: { userId },
      });
      expect(account).toBeTruthy();
      expect(Number(account?.balance)).toBe(0);

      await prisma.bankAccount.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
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
      const originId = `account-origin-${Date.now()}-${Math.random()}`;
      const destId = `account-dest-${Date.now()}-${Math.random()}`;
      await prisma.bankAccount.createMany({
        data: [
          { id: originId, balance: 15 },
          { id: destId, balance: 0 },
        ],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: originId,
          destination: destId,
          amount: 15,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        origin: {
          id: originId,
          balance: 0,
        },
        destination: {
          id: destId,
          balance: 15,
        },
      });

      await prisma.bankAccount.deleteMany({
        where: { id: { in: [originId, destId] } },
      });
    });

    test('should create destination account if it does not exist', async () => {
      const originId = `account-origin-${Date.now()}-${Math.random()}`;
      const destId = `account-dest-${Date.now()}-${Math.random()}`;
      await prisma.bankAccount.create({
        data: {
          id: originId,
          balance: 15,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: originId,
          destination: destId,
          amount: 15,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        origin: {
          id: originId,
          balance: 0,
        },
        destination: {
          id: destId,
          balance: 15,
        },
      });

      const destAccount = await prisma.bankAccount.findUnique({
        where: { id: destId },
      });
      expect(destAccount).toBeTruthy();
      expect(Number(destAccount?.balance)).toBe(15);

      await prisma.bankAccount.deleteMany({
        where: { id: { in: [originId, destId] } },
      });
    });

    test('US-013: should return 0 for non-existing origin account', async () => {
      const originId = `account-nonexistent-${Date.now()}-${Math.random()}`;
      const destId = `account-dest-${Date.now()}-${Math.random()}`;
      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: originId,
          destination: destId,
          amount: 15,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(Number(response.body)).toBe(0);
    });

    test('US-014: should reject transfer with insufficient funds', async () => {
      const originId = `account-origin-${Date.now()}-${Math.random()}`;
      const destId = `account-dest-${Date.now()}-${Math.random()}`;
      await prisma.bankAccount.create({
        data: {
          id: originId,
          balance: 10,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: originId,
          destination: destId,
          amount: 20,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');

      await prisma.bankAccount.delete({ where: { id: originId } });
    });

    test('should reject transfer with same origin and destination', async () => {
      const accountId = `account-${Date.now()}-${Math.random()}`;
      await prisma.bankAccount.create({
        data: {
          id: accountId,
          balance: 15,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: accountId,
          destination: accountId,
          amount: 5,
        },
      });

      expect(response.statusCode).toBe(400);

      await prisma.bankAccount.delete({ where: { id: accountId } });
    });

    test('should reject missing origin or destination', async () => {
      const destId = `account-dest-${Date.now()}-${Math.random()}`;
      const response1 = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          destination: destId,
          amount: 15,
        },
      });

      expect(response1.statusCode).toBe(401);

      const originId = `account-origin-${Date.now()}-${Math.random()}`;
      const response2 = await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: originId,
          amount: 15,
        },
      });

      expect(response2.statusCode).toBe(400);
    });
  });

  describe('Complex scenarios', () => {
    test('should handle multiple operations in sequence', async () => {
      const userId = await createTestUser();
      const token = createTestToken(userId);
      const accountId = `account-${Date.now()}`;

      await prisma.bankAccount.create({
        data: {
          id: accountId,
          balance: 100,
          userId,
        },
      });

      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'deposit',
          destination: accountId,
          amount: 0,
        },
      });

      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'withdraw',
          origin: accountId,
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

      const destAccountId = `account-dest-${Date.now()}`;
      await app.inject({
        method: 'POST',
        url: '/event',
        payload: {
          type: 'transfer',
          origin: accountId,
          destination: destAccountId,
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

      await prisma.bankAccount.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    test('should maintain data integrity after reset', async () => {
      const userId = await createTestUser();
      const accountId = `account-${Date.now()}`;
      await prisma.bankAccount.create({
        data: {
          id: accountId,
          balance: 50,
          userId,
        },
      });

      const token = createTestToken(userId);

      await app.inject({
        method: 'POST',
        url: '/reset',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/balance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      expect(response.statusCode).toBe(200);
      expect(Number(response.body)).toBe(0);

      await prisma.user.delete({ where: { id: userId } });
    });
  });
});
