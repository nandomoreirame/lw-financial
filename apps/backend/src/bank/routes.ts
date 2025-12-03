import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/authentication';
import { balanceHandler, balanceSchema } from './handlers/balance';
import { eventHandler, eventSchema } from './handlers/event';
import { resetHandler, resetSchema } from './handlers/reset';

/**
 * Bank routes plugin
 * Registers all banking-related endpoints
 */
export async function bankRoutes(fastify: FastifyInstance) {
  // Error handler for authentication errors
  fastify.setErrorHandler((error: unknown, request, reply) => {
    // Handle authentication errors
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 401 || err.statusCode === 403) {
      return reply.status(err.statusCode).send({
        error: err.message || 'Authentication error',
      });
    }
    // Let Fastify handle other errors
    throw error;
  });

  // GET /balance - Query account balance (requires authentication)
  fastify.get(
    '/balance',
    {
      schema: balanceSchema,
      preHandler: authenticateRequest,
    },
    balanceHandler
  );

  // POST /event - Process banking events (deposit, withdraw, transfer)
  fastify.post('/event', { schema: eventSchema }, eventHandler);

  // POST /reset - Reset system state
  fastify.post('/reset', { schema: resetSchema }, resetHandler);
}
