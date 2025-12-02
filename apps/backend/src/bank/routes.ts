import { FastifyInstance } from 'fastify';
import { balanceHandler, balanceSchema } from './handlers/balance';
import { eventHandler, eventSchema } from './handlers/event';
import { resetHandler, resetSchema } from './handlers/reset';

/**
 * Bank routes plugin
 * Registers all banking-related endpoints
 */
export async function bankRoutes(fastify: FastifyInstance) {
  // GET /balance - Query account balance
  fastify.get('/balance', { schema: balanceSchema }, balanceHandler);

  // POST /event - Process banking events (deposit, withdraw, transfer)
  fastify.post('/event', { schema: eventSchema }, eventHandler);

  // POST /reset - Reset system state
  fastify.post('/reset', { schema: resetSchema }, resetHandler);
}
