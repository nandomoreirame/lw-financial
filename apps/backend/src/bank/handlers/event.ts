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
  amount: number;
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

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return reply.status(400).send({ error: 'Invalid amount' });
  }

  // Validate amount precision (2 decimal places)
  // Convert to string to check decimal places accurately
  const amountStr = amount.toString();
  const decimalPart = amountStr.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return reply.status(400).send({
      error: 'Amount must have at most 2 decimal places',
    });
  }

  // Validate amount range (0.01 to 999999.99)
  if (amount < 0.01 || amount > 999999.99) {
    return reply.status(400).send({
      error: 'Amount must be between R$ 0,01 and R$ 999.999,99',
    });
  }

  try {
    switch (type) {
      case 'deposit': {
        // For authenticated users without destination, identify account automatically from JWT
        let accountId: string;
        let userId: string | undefined;

        if (!destination) {
          // No destination provided - require authentication
          if (!user) {
            return reply.status(401).send({
              error: 'Authentication required when destination is not provided',
            });
          }
          // Authenticated: use user's default account
          userId = user.userId;
          const defaultAccount =
            await accountService.getOrCreateDefaultAccount(userId);
          accountId = defaultAccount.id;
        } else {
          // Destination provided
          accountId = destination;
          if (user) {
            // User is authenticated - use userId for transaction logging
            userId = user.userId;
          }
        }

        const result = await accountService.deposit(accountId, amount, userId);
        return reply.status(201).send({
          destination: result,
        });
      }

      case 'withdraw': {
        // For authenticated users without origin, identify account automatically from JWT
        let accountId: string;
        let userId: string | undefined;

        if (!origin) {
          // No origin provided - require authentication
          if (!user) {
            return reply.status(401).send({
              error: 'Authentication required when origin is not provided',
            });
          }
          // Authenticated: use user's default account
          userId = user.userId;
          const defaultAccount =
            await accountService.getOrCreateDefaultAccount(userId);
          accountId = defaultAccount.id;
        } else {
          // Origin provided
          accountId = origin;
          if (user) {
            // User is authenticated - use userId for transaction logging
            userId = user.userId;
          }
        }

        const result = await accountService.withdraw(accountId, amount, userId);
        return reply.status(201).send({
          origin: result,
        });
      }

      case 'transfer': {
        // Transfer still requires origin and destination
        if (!origin || !destination) {
          return reply.status(400).send({
            error: 'Origin and destination are required for transfer',
          });
        }

        if (origin === destination) {
          return reply
            .status(400)
            .send({ error: 'Origin and destination cannot be the same' });
        }

        // Extract userId if authenticated (for transaction logging)
        const userId = user?.userId;

        const result = await accountService.transfer(
          origin,
          destination,
          amount,
          userId
        );
        return reply.status(201).send(result);
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

    // Log unexpected errors
    request.log.error({ err: error }, 'Unexpected error in event handler');
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for event endpoint
 */
export const eventSchema = {
  description:
    'Processa eventos bancarios (deposito, saque, transferencia). Para usuarios autenticados, identifica automaticamente a conta padrao do usuario a partir do token JWT. Nao e necessario enviar destination (deposito) ou origin (saque) quando autenticado.',
  tags: ['bank'],
  body: {
    type: 'object',
    required: ['type', 'amount'],
    properties: {
      type: {
        type: 'string',
        enum: ['deposit', 'withdraw', 'transfer'],
        description: 'Tipo de operacao',
      },
      origin: {
        type: 'string',
        description:
          'ID da conta de origem. Obrigatorio para transferencia. Para saques autenticados, pode ser omitido (backend identifica automaticamente).',
      },
      destination: {
        type: 'string',
        description:
          'ID da conta de destino. Obrigatorio para transferencia. Para depositos autenticados, pode ser omitido (backend identifica automaticamente).',
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        maximum: 999999.99,
        description:
          'Valor da operacao em reais (R$). Minimo: R$ 0,01. Maximo: R$ 999.999,99. Precisao: 2 casas decimais.',
      },
    },
  },
  response: {
    201: {
      description: 'Operacao realizada com sucesso',
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
      description: 'Requisicao invalida ou saldo insuficiente',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    401: {
      description: 'Nao autenticado ou token invalido',
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
