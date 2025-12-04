import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types/auth';
import {
  AccountNotFoundError,
  accountService,
} from '../services/account.service';

/**
 * Response structure for balance query
 */
interface BalanceResponse {
  balance: number;
}

/**
 * Handler for GET /balance endpoint
 * Returns the balance of the authenticated user's bank account
 * If account_code is provided in query, returns balance for that specific account
 * Otherwise, returns balance for the user's default account
 */
export async function balanceHandler(
  request: FastifyRequest<{ Querystring: { account_code?: string } }>,
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

    const accountCode = request.query.account_code;

    if (accountCode) {
      const account = await accountService.getAccountByCode(
        accountCode,
        userId
      );
      return reply.status(200).send(account.balance);
    }

    const balance = await accountService.getBalanceByUserId(userId);
    return reply.status(200).send(balance);
  } catch (error) {
    if (error instanceof AccountNotFoundError) {
      return reply.status(404).send({
        error: error.message,
      });
    }

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
    'Consulta o saldo da conta bancária. Se account_code for fornecido, retorna o saldo dessa conta específica. Caso contrário, retorna o saldo da conta padrão do usuário autenticado. O userId é extraído do token JWT.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      account_code: {
        type: 'string',
        pattern: '^\\d{4}-\\d$',
        description:
          'Código da conta no formato XXXX-X (opcional). Se não fornecido, retorna a conta padrão do usuário.',
      },
    },
  },
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
    404: {
      description: 'Conta não encontrada ou acesso negado',
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
