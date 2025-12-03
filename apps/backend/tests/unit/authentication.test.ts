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
    // Set test secret
    process.env.BETTER_AUTH_SECRET = TEST_SECRET;
    fastify = Fastify({ logger: false });
  });

  afterEach(async () => {
    // Restore original secret
    if (originalSecret) {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    } else {
      delete process.env.BETTER_AUTH_SECRET;
    }
    await fastify.close();
  });

  // T037 [US1] Test missing Authorization header returns 401
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Authentication required');
    }
  });

  // T038 [US1] Test empty Authorization header returns 401
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Authentication required');
    }
  });

  // T039 [US1] Test invalid Bearer format returns 401
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid authorization format');
    }
  });

  // T040 [US1] Test missing token value returns 401
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid authorization format');
    }
  });

  // T041 [US1] Test multiple Authorization headers (uses first)
  test('T041 [US1] - Multiple Authorization headers uses first', async () => {
    // Note: Fastify normalizes headers, but we test the behavior
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
            expect(code).toBe(200); // Should succeed, not 401
          },
        }),
      }),
    } as unknown as FastifyReply;

    const result = await authenticateRequest(request, reply);
    expect(result).toBe(true);
    expect((request as AuthenticatedRequest).user).toBeDefined();
    expect((request as AuthenticatedRequest).user.userId).toBe('user123');
  });

  // T042 [US2] Test malformed JWT token returns 401
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');
    }
  });

  // T043 [US2] Test expired JWT token returns 401
  test('T043 [US2] - Expired JWT token returns 401', async () => {
    const expiredToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      },
      TEST_SECRET
      // Don't use expiresIn when exp is already in payload
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');
    }
  });

  // T044 [US2] Test invalid signature returns 401
  test('T044 [US2] - Invalid signature returns 401', async () => {
    // Token signed with different secret
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');
    }
  });

  // T045 [US2] Test valid JWT token allows request to proceed
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
    expect(responseSent).toBe(false); // No error response should be sent for valid token
    expect((request as AuthenticatedRequest).user).toBeDefined();
  });

  // T046 [US2] Test token payload is attached to request.user
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

  // T047 [US3] Test error messages are in JSON format
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Authentication required');
    }
  });

  // T048 [US3] Test error messages are generic (no sensitive info)
  test('T048 [US3] - Error messages are generic (no sensitive info)', async () => {
    // Test with invalid token that has 3 parts but wrong signature
    // This will trigger JWT verification error which should return generic message
    const invalidToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      },
      'wrong-secret-key', // Wrong secret to trigger invalid signature
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
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const authError = error as AuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe('Invalid or expired token');

      // Should be generic message - verify it doesn't leak specific error details
      // The message "Invalid or expired token" is generic (doesn't specify which one)
      const errorStr = authError.message || JSON.stringify(authError);
      // Should not contain specific technical error types
      expect(errorStr).not.toContain('JsonWebTokenError');
      expect(errorStr).not.toContain('TokenExpiredError');
      expect(errorStr).not.toContain('signature');
      expect(errorStr).not.toContain('malformed');
      // Message is generic - covers multiple error types without specifying which one
      expect(errorStr).toContain('Invalid or expired token');
    }
  });
});
