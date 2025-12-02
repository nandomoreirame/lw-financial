import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import Fastify, { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { authenticateRequest } from '../../src/middleware/authentication';
import { AuthenticatedRequest } from '../../src/types/auth';

describe('Protected Routes - Integration Tests', () => {
  let fastify: FastifyInstance;
  const TEST_SECRET = 'test-secret-key-min-32-characters-long-for-hs256';
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = TEST_SECRET;
    fastify = Fastify({ logger: false });

    // Register a protected route for testing
    fastify.get(
      '/api/protected',
      {
        preHandler: async (request, reply) => {
          const authenticated = await authenticateRequest(request, reply);
          if (!authenticated) {
            // Response already sent by middleware - prevent handler execution
            // Throw a special error that Fastify recognizes as "already handled"
            // This prevents the route handler from executing
            return reply; // Return reply object to stop further processing
          }
        },
      },
      async (request: AuthenticatedRequest, reply) => {
        // Verify reply wasn't sent (safety check)
        if (reply.sent || !request.user) {
          return;
        }
        return {
          message: 'Protected resource accessed',
          userId: request.user.userId,
          username: request.user.username,
        };
      }
    );

    // Add error handler that respects already-sent replies
    fastify.setErrorHandler((error, request, reply) => {
      // Only send error if reply hasn't been sent yet
      if (!reply.sent) {
        // Check if it's an authentication error that was already handled
        if (reply.statusCode === 401) {
          return; // Already handled by middleware
        }
        reply.status(500).send({ error: 'Internal server error' });
      }
    });
  });

  afterEach(async () => {
    if (originalSecret) {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    } else {
      delete process.env.BETTER_AUTH_SECRET;
    }
    await fastify.close();
  });

  // T050 [US1] Test protected route without token returns 401
  test('T050 [US1] - Protected route without token returns 401', async () => {
    await fastify.ready();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
    });

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/json');
    const body = JSON.parse(response.body);
    expect(body).toEqual({ error: 'Authentication required' });
  });

  // T051 [US2] Test protected route with valid token returns route response
  test('T051 [US2] - Protected route with valid token returns route response', async () => {
    await fastify.ready();

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

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Protected resource accessed');
    expect(body.userId).toBe('user123');
    expect(body.username).toBe('testuser');
  });

  // T052 [US2] Test protected route with invalid token returns 401
  test('T052 [US2] - Protected route with invalid token returns 401', async () => {
    await fastify.ready();

    // Test with expired token
    const expiredToken = jwt.sign(
      {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      },
      TEST_SECRET
      // Don't use expiresIn when exp is already in payload
    );

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/json');
    const body = JSON.parse(response.body);
    expect(body).toEqual({ error: 'Invalid or expired token' });
  });

  // T052 [US2] Test with malformed token
  test('T052 [US2] - Protected route with malformed token returns 401', async () => {
    await fastify.ready();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer invalid.jwt.token.format',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/json');
    const body = JSON.parse(response.body);
    expect(body).toEqual({ error: 'Invalid or expired token' });
  });

  // T052 [US2] Test with wrong signature
  test('T052 [US2] - Protected route with wrong signature returns 401', async () => {
    await fastify.ready();

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

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: `Bearer ${invalidToken}`,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/json');
    const body = JSON.parse(response.body);
    expect(body).toEqual({ error: 'Invalid or expired token' });
  });

  // T053 Test middleware performance is <50ms
  test('T053 - Middleware performance is <50ms', async () => {
    await fastify.ready();

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

    const startTime = Date.now();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(50); // Performance target: <50ms
  });

  // Additional test: Case-insensitive header name
  test('Case-insensitive Authorization header name', async () => {
    await fastify.ready();

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

    // Fastify normalizes headers to lowercase, but test with different case
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        Authorization: `Bearer ${validToken}`, // Capital A
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.userId).toBe('user123');
  });

  // Additional test: Empty token value
  test('Empty token value after Bearer prefix', async () => {
    await fastify.ready();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer ',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body).toEqual({ error: 'Invalid authorization format' });
  });

  // Additional test: Whitespace handling
  test('Whitespace after Bearer prefix is handled correctly', async () => {
    await fastify.ready();

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

    // Token with extra whitespace should be trimmed and work
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: `Bearer   ${validToken}   `, // Extra spaces
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.userId).toBe('user123');
  });
});
