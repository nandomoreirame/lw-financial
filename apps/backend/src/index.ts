import cors from '@fastify/cors';
import Fastify from 'fastify';
import { loginRoutes } from './auth/routes';
// T031: authenticateRequest function export is already available
// T034: Example of using middleware with fastify.addHook (commented for demonstration)
// T035: Example of using middleware with fastify.register plugin pattern (commented for demonstration)
// import { authenticateRequest } from './middleware/authentication';
// import { protectedRoutesPlugin } from './plugins/protected-routes';
// import { AuthenticatedRequest } from './types/auth';

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
 * T034: Example of applying middleware via fastify.addHook (preHandler)
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
 * T035: Example of applying middleware via fastify.register plugin pattern
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
