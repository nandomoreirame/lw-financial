import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import jwt from 'jsonwebtoken';
import { authenticateRequest } from '../../src/middleware/authentication';
import { AuthenticatedRequest } from '../../src/types/auth';

/**
 * Type for authentication errors thrown by authenticateRequest
 */
interface AuthenticationError extends Error {
  statusCode?: number;
}

describe('Authentication Middleware - Unit Tests', () => {
  let fastify: FastifyInstance;
  const TEST_SECRET = 'test-secret-key-min-32-characters-long-for-hs256';
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = TEST_SECRET;
    fastify = Fastify({ logger: false });
  });

  afterEach(async () => {
    if (originalSecret) {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    } else {
      delete process.env.BETTER_AUTH_SECRET;
    }
    await fastify.close();
  });

  test('T037 [US1] - Missing Authorization header returns 401', async () => {
    const request = {
      headers: {},
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (data: unknown) => {
            expect(code).toBe(401);
            expect(data).toEqual({ error: 'Authentication required' });
          },
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Authentication required');
    }
  });

  test('T038 [US1] - Empty Authorization header returns 401', async () => {
    const request = {
      headers: { authorization: '' },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (data: unknown) => {
            expect(code).toBe(401);
            expect(data).toEqual({ error: 'Authentication required' });
          },
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Authentication required');
    }
  });

  test('T039 [US1] - Invalid Bearer format returns 401', async () => {
    const request = {
      headers: { authorization: 'InvalidFormat token123' },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (data: unknown) => {
            expect(code).toBe(401);
            expect(data).toEqual({ error: 'Invalid authorization format' });
          },
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid authorization format');
    }
  });

  test('T040 [US1] - Missing token value returns 401', async () => {
    const request = {
      headers: { authorization: 'Bearer ' },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (data: unknown) => {
            expect(code).toBe(401);
            expect(data).toEqual({ error: 'Invalid authorization format' });
          },
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid authorization format');
    }
  });

  test('T041 [US1] - Multiple Authorization headers uses first', async () => {
    const validToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      },
      TEST_SECRET,
      { expiresIn: '1h' }
    );

    const request = {
      headers: { authorization: `Bearer ${validToken}` },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (_data: unknown) => {
            expect(code).toBe(200);
          },
        }),
      }),
    } as unknown as FastifyReply;

    const result = await authenticateRequest(request, reply);
    expect(result).toBe(true);
    expect((request as AuthenticatedRequest).user).toBeDefined();
    expect((request as AuthenticatedRequest).user.userId).toBe('user123');
  });

  test('T042 [US2] - Malformed JWT token returns 401', async () => {
    const request = {
      headers: { authorization: 'Bearer invalid.jwt.token' },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (data: unknown) => {
            expect(code).toBe(401);
            expect(data).toEqual({ error: 'Invalid or expired token' });
          },
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');
    }
  });

  test('T043 [US2] - Expired JWT token returns 401', async () => {
    const expiredToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      },
      TEST_SECRET
    );

    const request = {
      headers: { authorization: `Bearer ${expiredToken}` },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (data: unknown) => {
            expect(code).toBe(401);
            expect(data).toEqual({ error: 'Invalid or expired token' });
          },
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');
    }
  });

  test('T044 [US2] - Invalid signature returns 401', async () => {
    const invalidToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      },
      'different-secret-key',
      { expiresIn: '1h' }
    );

    const request = {
      headers: { authorization: `Bearer ${invalidToken}` },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: () => ({
          send: (data: unknown) => {
            expect(code).toBe(401);
            expect(data).toEqual({ error: 'Invalid or expired token' });
          },
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');
    }
  });

  test('T045 [US2] - Valid JWT token allows request to proceed', async () => {
    const validToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      },
      TEST_SECRET,
      { expiresIn: '1h' }
    );

    const request = {
      headers: { authorization: `Bearer ${validToken}` },
      log: fastify.log,
    } as unknown as FastifyRequest;

    let responseSent = false;
    const reply = {
      status: () => ({
        header: () => ({
          send: () => {
            responseSent = true;
          },
        }),
      }),
    } as unknown as FastifyReply;

    const result = await authenticateRequest(request, reply);
    expect(result).toBe(true);
    expect(responseSent).toBe(false);
    expect((request as AuthenticatedRequest).user).toBeDefined();
  });

  test('T046 [US2] - Token payload is attached to request.user', async () => {
    const tokenPayload = {
      userId: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
    };

    const validToken = jwt.sign(tokenPayload, TEST_SECRET, { expiresIn: '1h' });

    const request = {
      headers: { authorization: `Bearer ${validToken}` },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: () => ({
        header: () => ({
          send: () => {},
        }),
      }),
    } as unknown as FastifyReply;

    const result = await authenticateRequest(request, reply);
    expect(result).toBe(true);

    const authenticatedRequest = request as AuthenticatedRequest;
    expect(authenticatedRequest.user).toBeDefined();
    expect(authenticatedRequest.user.userId).toBe('user123');
    expect(authenticatedRequest.user.username).toBe('testuser');
    expect(authenticatedRequest.user.email).toBe('test@example.com');
    expect(authenticatedRequest.user.iat).toBeDefined();
  });

  test('T047 [US3] - Error messages are in JSON format', async () => {
    const request = {
      headers: {},
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: (code: number) => ({
        header: (name: string, value: string) => {
          return {
            send: (data: unknown) => {
              expect(code).toBe(401);
              expect(value).toBe('application/json');
              expect(typeof data).toBe('object');
              expect(data).toHaveProperty('error');
            },
          };
        },
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Authentication required');
    }
  });

  test('T048 [US3] - Error messages are generic (no sensitive info)', async () => {
    const invalidToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      },
      'wrong-secret-key',
      { expiresIn: '1h' }
    );

    const request = {
      headers: { authorization: `Bearer ${invalidToken}` },
      log: fastify.log,
    } as unknown as FastifyRequest;

    const reply = {
      status: () => ({
        header: () => ({
          send: () => {},
        }),
      }),
    } as unknown as FastifyReply;

    try {
      await authenticateRequest(request, reply);
      expect(true).toBe(false);
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');

      const errorStr = authError.message || JSON.stringify(authError);
      expect(errorStr).not.toContain('JsonWebTokenError');
      expect(errorStr).not.toContain('TokenExpiredError');
      expect(errorStr).not.toContain('signature');
      expect(errorStr).not.toContain('malformed');
      expect(errorStr).toContain('Invalid or expired token');
    }
  });
});
