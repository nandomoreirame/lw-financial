import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateRequest } from '../middleware/authentication';

/**
 * Plugin para rotas protegidas que requerem autenticação.
 *
 * Este plugin aplica automaticamente o middleware de autenticação
 * a todas as rotas registradas através dele.
 *
 * @example
 * ```typescript
 *
 * await fastify.register(protectedRoutesPlugin, {
 *   prefix: '/v1/protected'
 * });
 *
 *
 * fastify.get('/users', async (request: AuthenticatedRequest, reply) => {
 *
 *   return { userId: request.user.userId };
 * });
 * ```
 *
 * @example
 * ```typescript
 *
 * fastify.addHook('preHandler', async (request, reply) => {
 *
 *   const publicRoutes = ['/v1/login', '/v1/health'];
 *   if (publicRoutes.some(route => request.url.startsWith(route))) {
 *     return;
 *   }
 *
 *   const authenticated = await authenticateRequest(request, reply);
 *   if (!authenticated) {
 *     return;
 *   }
 * });
 * ```
 */
export async function protectedRoutesPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  fastify.addHook('preHandler', async (request, reply) => {
    const authenticated = await authenticateRequest(request, reply);
    if (!authenticated) {
      return;
    }
  });
}
