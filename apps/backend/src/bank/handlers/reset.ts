import { FastifyReply, FastifyRequest } from 'fastify';
import { accountService } from '../services/account.service';

/**
 * Handler for POST /reset endpoint
 * Resets all bank accounts and transactions
 */
export async function resetHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | void> {
  try {
    await accountService.reset();
    return reply.status(200).send('OK');
  } catch (error) {
    request.log.error({ err: error }, 'Unexpected error in reset handler');
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for reset endpoint
 */
export const resetSchema = {
  description:
    'Reseta o estado do sistema (limpa todas as contas e transacoes)',
  tags: ['bank'],
  response: {
    200: {
      description: 'Sistema resetado com sucesso',
      type: 'string',
    },
  },
};
