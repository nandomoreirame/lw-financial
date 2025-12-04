import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/authentication';
import { balanceHandler, balanceSchema } from './handlers/balance';
import { eventHandler, eventSchema } from './handlers/event';
import { resetHandler, resetSchema } from './handlers/reset';
import {
  transactionsHandler,
  transactionsSchema,
} from './handlers/transactions';

/**
 * Bank routes plugin
 * Registers all banking-related endpoints
 */
export async function bankRoutes(fastify: FastifyInstance) {
  fastify.log.info('Registering bank routes...');

  fastify.setErrorHandler((error: unknown, request, reply) => {
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 401 || err.statusCode === 403) {
      return reply.status(err.statusCode).send({
        error: err.message || 'Authentication error',
      });
    }
    throw error;
  });

  fastify.get(
    '/balance',
    {
      schema: balanceSchema,
      preHandler: authenticateRequest,
    },
    balanceHandler
  );

  fastify.post('/event', { schema: eventSchema }, eventHandler);

  fastify.post(
    '/reset',
    {
      schema: resetSchema,
      preHandler: authenticateRequest,
    },
    resetHandler
  );

  fastify.log.info('Registering GET /transactions route...');
  fastify.get(
    '/transactions',
    {
      schema: transactionsSchema,
      preHandler: authenticateRequest,
    },
    transactionsHandler
  );
  fastify.log.info('GET /transactions route registered successfully');

  fastify.log.info(
    'Bank routes registered: /balance, /event, /reset, /transactions'
  );
}
