import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import {
  AccountNotFoundError,
  accountService,
  InsufficientFundsError,
} from '../services/account.service';

/**
 * Event types for bank operations
 */
type EventType = 'deposit' | 'withdraw' | 'transfer';

/**
 * Request body for event endpoint
 */
interface EventRequestBody {
  type: EventType;
  origin?: string;
  destination?: string;
  originAccountCode?: string;
  destinationAccountCode?: string;
  amount: number;
  accountCode?: string;
}

/**
 * Response structure for deposit operation
 */
interface DepositResponse {
  destination: {
    id: string;
    balance: number;
  };
}

/**
 * Response structure for withdraw operation
 */
interface WithdrawResponse {
  origin: {
    id: string;
    balance: number;
  };
}

/**
 * Response structure for transfer operation
 */
interface TransferResponse {
  origin: {
    id: string;
    balance: number;
  };
  destination: {
    id: string;
    balance: number;
  };
}

/**
 * Helper function to extract user from JWT token if present
 * Returns null if token is missing or invalid
 */
function extractUserFromToken(
  request: FastifyRequest
): { userId: string; username: string; email: string } | null {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const authHeaderValue = Array.isArray(authHeader)
    ? authHeader[0]
    : authHeader;

  if (!authHeaderValue || !authHeaderValue.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeaderValue.substring(7).trim();
  if (!token) {
    return null;
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;

    return {
      userId: decoded.userId as string,
      username: decoded.username as string,
      email: decoded.email as string,
    };
  } catch {
    return null;
  }
}

/**
 * Helper function to resolve account ID from account code or fallback to default account
 * @param accountCode - Optional account code in format "XXXX-X"
 * @param user - User information from JWT token (required if accountCode is provided)
 * @param requireOwnership - Whether to validate that the account belongs to the user
 * @param fallbackAccountId - Optional fallback account ID (used when accountCode is not provided)
 * @returns Account ID
 * @throws Error with appropriate status code and message if validation fails
 */
async function resolveAccountId(
  accountCode: string | undefined,
  user: { userId: string; username: string; email: string } | null,
  requireOwnership: boolean,
  fallbackAccountId?: string
): Promise<string> {
  if (accountCode) {
    if (!user) {
      throw {
        statusCode: 401,
        message: 'Authentication required when using account code',
      };
    }

    if (!/^\d{4}-\d$/.test(accountCode)) {
      throw {
        statusCode: 400,
        message: 'Invalid account code format. Expected format: XXXX-X',
      };
    }

    try {
      const account = requireOwnership
        ? await accountService.getAccountByCode(accountCode, user.userId)
        : await accountService.getAccountByCodeWithoutOwnership(accountCode);
      return account.id;
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        throw {
          statusCode: 404,
          message: requireOwnership
            ? 'Account not found or access denied'
            : 'Account not found',
        };
      }
      throw error;
    }
  }

  if (fallbackAccountId) {
    return fallbackAccountId;
  }

  if (!user) {
    throw {
      statusCode: 401,
      message: 'Authentication required when account is not provided',
    };
  }

  const defaultAccount = await accountService.getOrCreateDefaultAccount(
    user.userId
  );
  return defaultAccount.id;
}

/**
 * Handler for POST /event endpoint
 * Processes deposit, withdraw, and transfer operations
 *
 * For authenticated users (deposit/withdraw):
 * - Automatically identifies account from JWT token
 * - Uses getOrCreateDefaultAccount(userId) to get or create the user's default account
 * - Does not require origin/destination in request body
 *
 * For transfers:
 * - Still requires origin and destination in request body
 * - Can be used by authenticated or unauthenticated users (if needed)
 */
export async function eventHandler(
  request: FastifyRequest<{ Body: EventRequestBody }>,
  reply: FastifyReply
): Promise<DepositResponse | WithdrawResponse | TransferResponse | void> {
  const { type, origin, destination, amount } = request.body;
  const user = extractUserFromToken(request);

  if (typeof amount !== 'number' || amount <= 0) {
    return reply.status(400).send({ error: 'Invalid amount' });
  }

  const amountStr = amount.toString();
  const decimalPart = amountStr.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return reply.status(400).send({
      error: 'Amount must have at most 2 decimal places',
    });
  }

  if (amount < 0.01 || amount > 999999.99) {
    return reply.status(400).send({
      error: 'Amount must be between R$ 0,01 and R$ 999.999,99',
    });
  }

  try {
    switch (type) {
      case 'deposit': {
        const { accountCode } = request.body;
        const userId = user?.userId;

        try {
          const accountId = await resolveAccountId(
            accountCode,
            user,
            true,
            destination
          );

          const result = await accountService.deposit(
            accountId,
            amount,
            userId,
            accountCode
          );
          return reply.status(201).send({
            destination: result,
          });
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'statusCode' in error &&
            'message' in error
          ) {
            return reply
              .status(error.statusCode as number)
              .send({ error: error.message as string });
          }
          throw error;
        }
      }

      case 'withdraw': {
        const { accountCode } = request.body;
        const userId = user?.userId;

        try {
          const accountId = await resolveAccountId(
            accountCode,
            user,
            true,
            origin
          );

          const result = await accountService.withdraw(
            accountId,
            amount,
            userId,
            accountCode
          );
          return reply.status(201).send({
            origin: result,
          });
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'statusCode' in error &&
            'message' in error
          ) {
            return reply
              .status(error.statusCode as number)
              .send({ error: error.message as string });
          }
          throw error;
        }
      }

      case 'transfer': {
        const { originAccountCode, destinationAccountCode } = request.body;
        const userId = user?.userId;

        try {
          const originId = await resolveAccountId(
            originAccountCode,
            user,
            true,
            origin
          );

          if (!destinationAccountCode && !destination) {
            return reply.status(400).send({
              error: 'Destination account is required for transfer',
            });
          }

          const destinationId = await resolveAccountId(
            destinationAccountCode,
            user,
            false,
            destination
          );

          if (originId === destinationId) {
            return reply
              .status(400)
              .send({ error: 'Origin and destination cannot be the same' });
          }

          const result = await accountService.transfer(
            originId,
            destinationId,
            amount,
            userId
          );
          return reply.status(201).send(result);
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'statusCode' in error &&
            'message' in error
          ) {
            return reply
              .status(error.statusCode as number)
              .send({ error: error.message as string });
          }
          throw error;
        }
      }

      default:
        return reply.status(400).send({ error: 'Invalid event type' });
    }
  } catch (error) {
    if (error instanceof AccountNotFoundError) {
      return reply.status(404).send(0);
    }

    if (error instanceof InsufficientFundsError) {
      return reply.status(400).send({ error: 'Insufficient funds' });
    }

    request.log.error({ err: error }, 'Unexpected error in event handler');
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for event endpoint
 */
export const eventSchema = {
  description:
    'Processa eventos bancários (deposito, saque, transferência). Para usuários autenticados, identifica automaticamente a conta padrão do usuário a partir do token JWT. Nao e necessário enviar destination (deposito) ou origin (saque) quando autenticado.',
  tags: ['bank'],
  body: {
    type: 'object',
    required: ['type', 'amount'],
    properties: {
      type: {
        type: 'string',
        enum: ['deposit', 'withdraw', 'transfer'],
        description: 'Tipo de operação',
      },
      origin: {
        type: 'string',
        description:
          'ID da conta de origem. Obrigatório para transferência. Para saques autenticados, pode ser omitido (backend identifica automaticamente).',
      },
      destination: {
        type: 'string',
        description:
          'ID da conta de destino. Obrigatório para transferência. Para depósitos autenticados, pode ser omitido (backend identifica automaticamente).',
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        maximum: 999999.99,
        description:
          'Valor da operação em reais (R$). Mínimo: R$ 0,01. Máximo: R$ 999.999,99. Precisão: 2 casas decimais.',
      },
      accountCode: {
        type: 'string',
        description:
          'Código da conta no formato XXXX-X. Opcional. Se fornecido, a operação será aplicada à conta especificada. Requer autenticação.',
        pattern: '^\\d{4}-\\d$',
      },
      originAccountCode: {
        type: 'string',
        description:
          'Código da conta de origem no formato XXXX-X. Opcional para transferências. Se fornecido, será usado em vez do ID. Requer autenticação e a conta deve pertencer ao usuário.',
        pattern: '^\\d{4}-\\d$',
      },
      destinationAccountCode: {
        type: 'string',
        description:
          'Código da conta de destino no formato XXXX-X. Opcional para transferências. Se fornecido, será usado em vez do ID. Não requer que a conta pertença ao usuário.',
        pattern: '^\\d{4}-\\d$',
      },
    },
  },
  response: {
    201: {
      description: 'Operação realizada com sucesso',
      type: 'object',
      properties: {
        origin: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            balance: { type: 'number' },
          },
        },
        destination: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            balance: { type: 'number' },
          },
        },
      },
    },
    400: {
      description: 'Requisição inválida ou saldo insuficiente',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    401: {
      description: 'Não autenticado ou token inválido',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    404: {
      description: 'Conta não encontrada',
      type: 'number',
    },
  },
};
