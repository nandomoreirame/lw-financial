import cors from '@fastify/cors';
import Fastify from 'fastify';
import { loginRoutes } from './auth/routes';
// Example imports for protected routes (commented for demonstration)
// import { authenticateRequest } from './middleware/authentication';
// import { protectedRoutesPlugin } from './plugins/protected-routes';
// import { AuthenticatedRequest } from './types/auth';

/**
 * Validates that BETTER_AUTH_SECRET is configured and meets minimum security requirements.
 * HS256 algorithm requires a secret with sufficient length for security.
 *
 * @throws Error if secret is missing or too short
 */
function validateAuthSecret(): void {
  const secret = process.env.BETTER_AUTH_SECRET;
  const MIN_SECRET_LENGTH = 32; // Minimum recommended length for HS256

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

// Validate authentication secret at startup
validateAuthSecret();

const fastify = Fastify({ logger: true });

// Configure CORS
fastify.register(cors, {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
});

// Register auth routes
fastify.register(loginRoutes);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Legacy API endpoint (maintained for compatibility)
fastify.get('/api', async () => {
  return { message: 'Hello from backend API!' };
});

/**
 * Example: Applying middleware via fastify.addHook (preHandler)
 *
 * This approach applies authentication to all routes except public ones.
 * Uncomment to enable global authentication protection.
 *
 * @example
 * ```typescript
 * fastify.addHook('preHandler', async (request, reply) => {
 *   // List of public routes that don't require authentication
 *   const publicRoutes = ['/login', '/health', '/api/auth'];
 *
 *   // Skip authentication for public routes
 *   if (publicRoutes.some(route => request.url.startsWith(route))) {
 *     return;
 *   }
 *
 *   // Apply authentication middleware
 *   const authenticated = await authenticateRequest(request, reply);
 *   if (!authenticated) {
 *     return; // Response already sent by middleware
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
 * // Register protected routes plugin with a prefix
 * await fastify.register(protectedRoutesPlugin, {
 *   prefix: '/api/protected'
 * });
 *
 * // Example protected route (would be registered inside the plugin or separately)
 * fastify.get('/api/protected/profile', async (request: AuthenticatedRequest, reply) => {
 *   return {
 *     userId: request.user.userId,
 *     username: request.user.username,
 *     email: request.user.email
 *   };
 * });
 * ```
 */

const PORT = process.env.PORT || 3001;

fastify.listen({ port: Number(PORT), host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Backend server running on http://localhost:${PORT}`);
});
