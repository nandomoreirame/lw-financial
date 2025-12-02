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
 * // Registrar plugin em apps/backend/src/index.ts
 * await fastify.register(protectedRoutesPlugin, {
 *   prefix: '/api/protected'
 * });
 *
 * // Agora todas as rotas registradas no plugin precisam de autenticação
 * fastify.get('/users', async (request: AuthenticatedRequest, reply) => {
 *   // request.user está disponível aqui
 *   return { userId: request.user.userId };
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Usar como hook global (alternativa)
 * fastify.addHook('preHandler', async (request, reply) => {
 *   // Pular autenticação para rotas públicas
 *   const publicRoutes = ['/login', '/health'];
 *   if (publicRoutes.some(route => request.url.startsWith(route))) {
 *     return;
 *   }
 *
 *   const authenticated = await authenticateRequest(request, reply);
 *   if (!authenticated) {
 *     return; // Resposta já enviada pelo middleware
 *   }
 * });
 * ```
 */
export async function protectedRoutesPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // Aplicar autenticação a todas as rotas neste plugin
  fastify.addHook('preHandler', async (request, reply) => {
    const authenticated = await authenticateRequest(request, reply);
    if (!authenticated) {
      return; // Resposta já enviada pelo middleware
    }
  });

  // Exemplo de rota protegida (pode ser removido se não necessário)
  // Rotas específicas devem ser registradas no arquivo principal
  // ou em outros plugins que registrem este plugin como dependência
}
