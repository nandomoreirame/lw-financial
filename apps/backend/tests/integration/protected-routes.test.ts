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

    fastify.get(
      '/api/protected',
      {
        preHandler: authenticateRequest,
      },
      async (request: AuthenticatedRequest, _reply) => {
        const authRequest = request as AuthenticatedRequest;
        return {
          message: 'Protected resource accessed',
          userId: authRequest.user.userId,
          username: authRequest.user.username,
        };
      }
    );

    fastify.setErrorHandler((error, request, reply) => {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return reply.status(error.statusCode).send({
          error: error.message,
        });
      }
      reply.status(500).send({ error: 'Internal server error' });
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

  test('T052 [US2] - Protected route with invalid token returns 401', async () => {
    await fastify.ready();

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
    expect(duration).toBeLessThan(50);
  });

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

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.userId).toBe('user123');
  });

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

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: `Bearer   ${validToken}   `,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.userId).toBe('user123');
  });
});
