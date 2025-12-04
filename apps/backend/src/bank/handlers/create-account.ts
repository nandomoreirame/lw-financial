import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types/auth';
import { accountService } from '../services/account.service';

/**
 * Request body for creating a new account
 */
interface CreateAccountRequest {
  initialBalance?: number;
}

/**
 * Response for creating a new account
 */
interface CreateAccountResponse {
  id: string;
  code: string | null;
  balance: number;
}

/**
 * Handler for POST /accounts endpoint
 * Creates a new bank account for the authenticated user
 */
export async function createAccountHandler(
  request: FastifyRequest<{ Body: CreateAccountRequest }>,
  reply: FastifyReply
): Promise<CreateAccountResponse | void> {
  const authRequest = request as AuthenticatedRequest;
  try {
    const userId = authRequest.user.userId;

    if (!userId) {
      return reply
        .status(401)
        .send({ error: 'User information not found in token' });
    }

    const initialBalance = request.body.initialBalance || 0;

    if (initialBalance < 0 || initialBalance > 999999.99) {
      return reply.status(400).send({
        error: 'Initial balance must be between 0 and 999.999,99',
      });
    }

    const account = await accountService.createAccount(userId, initialBalance);

    return reply.status(201).send(account);
  } catch (error) {
    authRequest.log.error(
      { err: error },
      'Unexpected error in create account handler'
    );
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for create account endpoint
 */
export const createAccountSchema = {
  description:
    'Cria uma nova conta bancária para o usuário autenticado. Sempre cria uma nova conta, mesmo que o usuário já tenha outras contas.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      initialBalance: {
        type: 'number',
        minimum: 0,
        maximum: 999999.99,
        description:
          'Saldo inicial da conta (opcional). Se não fornecido, será 0.',
      },
    },
  },
  response: {
    201: {
      description: 'Conta criada com sucesso',
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
    400: {
      description: 'Erro de validação',
      type: 'object',
      properties: {
        error: { type: 'string' },
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
