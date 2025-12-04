import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types/auth';
import { accountService } from '../services/account.service';

/**
 * Handler for POST /reset endpoint
 * Resets all bank accounts and transactions
 * Requires authentication via JWT token
 */
export async function resetHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | void> {
  const authRequest = request as AuthenticatedRequest;
  try {
    await accountService.reset();
    return reply.status(200).send('OK');
  } catch (error) {
    authRequest.log.error({ err: error }, 'Unexpected error in reset handler');
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for reset endpoint
 */
export const resetSchema = {
  description:
    'Reseta o estado do sistema (limpa todas as contas e transacoes). Requer autenticação JWT.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Sistema resetado com sucesso',
      type: 'string',
    },
    401: {
      description: 'Não autorizado - Token JWT inválido ou ausente',
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Mensagem de erro de autenticação',
        },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Mensagem de erro',
        },
      },
    },
  },
};
