import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types/auth';
import { accountService } from '../services/account.service';

/**
 * Response structure for balance query
 */
interface BalanceResponse {
  balance: number;
}

/**
 * Handler for GET /balance endpoint
 * Returns the balance of the authenticated user's bank account
 * The account ID is extracted from the JWT token, not from the URL
 */
export async function balanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<BalanceResponse | number | void> {
  const authRequest = request as AuthenticatedRequest;
  try {
    const userId = authRequest.user.userId;

    if (!userId) {
      return reply
        .status(401)
        .send({ error: 'User information not found in token' });
    }

    const balance = await accountService.getBalanceByUserId(userId);
    return reply.status(200).send(balance);
  } catch (error) {
    authRequest.log.error(
      { err: error },
      'Unexpected error in balance handler'
    );
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for balance endpoint
 */
export const balanceSchema = {
  description:
    'Consulta o saldo da conta bancária padrão do usuário autenticado. O userId é extraído do token JWT. Se o usuário não tiver conta, uma conta padrão é criada automaticamente com saldo 0.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Saldo da conta',
      type: 'number',
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
