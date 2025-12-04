import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types/auth';
import {
  AccountNotFoundError,
  accountService,
} from '../services/account.service';

/**
 * Account code format validation regex
 * Format: XXXX-X (4 digits, hyphen, 1 digit)
 */
const ACCOUNT_CODE_REGEX = /^\d{4}-\d$/;

/**
 * Handler for GET /accounts/:code endpoint
 * Returns account information by account code
 */
export async function accountByCodeHandler(
  request: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply
): Promise<void> {
  const authRequest = request as AuthenticatedRequest;
  try {
    const userId = authRequest.user.userId;
    const { code } = request.params;

    if (!userId) {
      return reply
        .status(401)
        .send({ error: 'User information not found in token' });
    }

    if (!ACCOUNT_CODE_REGEX.test(code)) {
      return reply.status(400).send({
        error: 'Invalid account code format. Expected format: XXXX-X',
      });
    }

    const account = await accountService.getAccountByCode(code, userId);

    return reply.status(200).send(account);
  } catch (error) {
    if (error instanceof AccountNotFoundError) {
      return reply.status(404).send({
        error: 'Account not found or access denied',
      });
    }

    authRequest.log.error(
      { err: error },
      'Unexpected error in account-by-code handler'
    );
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for account-by-code endpoint
 */
export const accountByCodeSchema = {
  description:
    'Busca uma conta bancária pelo código único. O código deve estar no formato XXXX-X (4 dígitos, hífen, 1 dígito). O userId é extraído do token JWT para validar propriedade da conta.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        pattern: '^\\d{4}-\\d$',
        description: 'Código da conta no formato XXXX-X',
      },
    },
    required: ['code'],
  },
  response: {
    200: {
      description: 'Dados da conta bancária',
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
      description: 'Formato de código inválido',
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
