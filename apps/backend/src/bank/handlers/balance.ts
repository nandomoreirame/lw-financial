import { FastifyReply, FastifyRequest } from 'fastify';
import {
  accountService,
  AccountNotFoundError,
} from '../services/account.service';

/**
 * Query parameters for balance endpoint
 */
interface BalanceQuerystring {
  account_id: string;
}

/**
 * Response structure for balance query
 */
interface BalanceResponse {
  balance: number;
}

/**
 * Handler for GET /balance endpoint
 * Returns the balance of a bank account
 */
export async function balanceHandler(
  request: FastifyRequest<{ Querystring: BalanceQuerystring }>,
  reply: FastifyReply
): Promise<BalanceResponse | number | void> {
  const { account_id } = request.query;

  // Validate account_id parameter
  if (
    !account_id ||
    typeof account_id !== 'string' ||
    account_id.trim() === ''
  ) {
    return reply.status(400).send({ error: 'account_id is required' });
  }

  try {
    const balance = await accountService.getBalance(account_id);
    return reply.status(200).send(balance);
  } catch (error) {
    if (error instanceof AccountNotFoundError) {
      return reply.status(404).send(0);
    }

    // Log unexpected errors
    request.log.error({ err: error }, 'Unexpected error in balance handler');
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for balance endpoint
 */
export const balanceSchema = {
  description: 'Consulta o saldo de uma conta bancaria',
  tags: ['bank'],
  querystring: {
    type: 'object',
    required: ['account_id'],
    properties: {
      account_id: {
        type: 'string',
        description: 'ID da conta bancaria',
      },
    },
  },
  response: {
    200: {
      description: 'Saldo da conta',
      type: 'number',
    },
    400: {
      description: 'Requisicao invalida',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    404: {
      description: 'Conta nao encontrada',
      type: 'number',
    },
  },
};
