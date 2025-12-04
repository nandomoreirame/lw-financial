import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/authentication';
import {
  accountByCodeHandler,
  accountByCodeSchema,
} from './handlers/account-by-code';
import { accountsHandler, accountsSchema } from './handlers/accounts';
import { balanceHandler, balanceSchema } from './handlers/balance';
import {
  createAccountHandler,
  createAccountSchema,
} from './handlers/create-account';
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
    // Type assertion needed due to incompatibility between explicit handler types
    // and Fastify's generic route handler types when using schemas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    balanceHandler as any
  );

  fastify.get(
    '/accounts',
    {
      schema: accountsSchema,
      preHandler: authenticateRequest,
    },
    accountsHandler
  );

  fastify.post(
    '/accounts',
    {
      schema: createAccountSchema,
      preHandler: authenticateRequest,
    },
    // Type assertion needed due to incompatibility between explicit handler types
    // and Fastify's generic route handler types when using schemas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createAccountHandler as any
  );

  fastify.get(
    '/accounts/:code',
    {
      schema: accountByCodeSchema,
      preHandler: authenticateRequest,
    },
    // Type assertion needed due to incompatibility between explicit handler types
    // and Fastify's generic route handler types when using schemas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountByCodeHandler as any
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
    // Type assertion needed due to incompatibility between explicit handler types
    // and Fastify's generic route handler types when using schemas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transactionsHandler as any
  );
  fastify.log.info('GET /transactions route registered successfully');

  fastify.log.info(
    'Bank routes registered: /balance, /accounts, /accounts (POST), /accounts/:code, /event, /reset, /transactions'
  );
}
