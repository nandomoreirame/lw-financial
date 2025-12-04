import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { loginRoutes } from './auth/routes';
import { bankRoutes } from './bank/routes';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';

/**
 * Validates that BETTER_AUTH_SECRET is configured and meets minimum security requirements.
 * HS256 algorithm requires a secret with sufficient length for security.
 *
 * @throws Error if secret is missing or too short
 */
function validateAuthSecret(): void {
  const secret = process.env.BETTER_AUTH_SECRET;
  const MIN_SECRET_LENGTH = 32;

  if (!secret) {
    throw new Error(
      'BETTER_AUTH_SECRET environment variable is required but not configured'
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `BETTER_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters long for HS256 algorithm security. Current length: ${secret.length}`
    );
  }
}

validateAuthSecret();

const fastify = Fastify({ logger: true });

/**
 * Initialize and start the Fastify server
 */
async function start() {
  try {
    await fastify.register(cors, {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    });

    await fastify.register(swagger, swaggerOptions);
    await fastify.register(swaggerUi, swaggerUiOptions);

    await fastify.register(
      async function v1Routes(fastify) {
        await fastify.register(loginRoutes);

        await fastify.register(bankRoutes);

        fastify.get(
          '/health',
          {
            schema: {
              description: 'Endpoint de verificação de saúde do sistema',
              tags: ['health'],
              response: {
                200: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
            },
          },
          async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
          }
        );
      },
      { prefix: '/v1' }
    );

    /**
     * Example: Applying middleware via fastify.addHook (preHandler)
     *
     * This approach applies authentication to all routes except public ones.
     * Uncomment to enable global authentication protection.
     *
     * @example
     * ```typescript
     * fastify.addHook('preHandler', async (request, reply) => {
     *
     *   const publicRoutes = ['/v1/login', '/v1/health', '/v1/auth'];
     *
     *
     *   if (publicRoutes.some(route => request.url.startsWith(route))) {
     *     return;
     *   }
     *
     *
     *   const authenticated = await authenticateRequest(request, reply);
     *   if (!authenticated) {
     *     return;
     *   }
     * });
     * ```
     */

    /**
     * Example: Applying middleware via fastify.register plugin pattern
     *
     * This approach applies authentication to routes registered through the plugin.
     * Uncomment to enable protected routes plugin.
     *
     * @example
     * ```typescript
     *
     * await fastify.register(protectedRoutesPlugin, {
     *   prefix: '/v1/protected'
     * });
     *
     *
     * fastify.get('/v1/protected/profile', async (request: AuthenticatedRequest, reply) => {
     *   return {
     *     userId: request.user.userId,
     *     username: request.user.username,
     *     email: request.user.email
     *   };
     * });
     * ```
     */

    const PORT = process.env.PORT || 3001;

    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' });
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(
      `Swagger documentation available at http://localhost:${PORT}/docs`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
