import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types/auth';
import {
  accountService,
  type AccountBalance,
} from '../services/account.service';

/**
 * Handler for GET /accounts endpoint
 * Returns all bank accounts for the authenticated user
 */
export async function accountsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AccountBalance[] | void> {
  const authRequest = request as AuthenticatedRequest;
  try {
    const userId = authRequest.user.userId;

    if (!userId) {
      return reply
        .status(401)
        .send({ error: 'User information not found in token' });
    }

    const accounts = await accountService.getUserAccounts(userId);
    return reply.status(200).send(accounts);
  } catch (error) {
    authRequest.log.error(
      { err: error },
      'Unexpected error in accounts handler'
    );
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for accounts endpoint
 */
export const accountsSchema = {
  description:
    'Lista todas as contas bancárias do usuário autenticado. O userId é extraído do token JWT.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Lista de contas bancárias',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID da conta' },
          code: {
            type: 'string',
            nullable: true,
            description: 'Código único da conta no formato XXXX-X',
          },
          balance: { type: 'number', description: 'Saldo da conta' },
        },
      },
    },
    401: {
      description: 'Não autenticado',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};
