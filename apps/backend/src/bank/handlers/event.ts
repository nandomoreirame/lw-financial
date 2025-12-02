import { FastifyReply, FastifyRequest } from 'fastify';
import {
  accountService,
  AccountNotFoundError,
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
 * Handler for POST /event endpoint
 * Processes deposit, withdraw, and transfer operations
 */
export async function eventHandler(
  request: FastifyRequest<{ Body: EventRequestBody }>,
  reply: FastifyReply
): Promise<DepositResponse | WithdrawResponse | TransferResponse | void> {
  const { type, origin, destination, amount } = request.body;

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return reply.status(400).send({ error: 'Invalid amount' });
  }

  try {
    switch (type) {
      case 'deposit': {
        if (!destination) {
          return reply
            .status(400)
            .send({ error: 'Destination is required for deposit' });
        }

        const result = await accountService.deposit(destination, amount);
        return reply.status(201).send({
          destination: result,
        });
      }

      case 'withdraw': {
        if (!origin) {
          return reply
            .status(400)
            .send({ error: 'Origin is required for withdraw' });
        }

        const result = await accountService.withdraw(origin, amount);
        return reply.status(201).send({
          origin: result,
        });
      }

      case 'transfer': {
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

        const result = await accountService.transfer(
          origin,
          destination,
          amount
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
  description: 'Processa eventos bancarios (deposito, saque, transferencia)',
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
          'ID da conta de origem (obrigatorio para saque e transferencia)',
      },
      destination: {
        type: 'string',
        description:
          'ID da conta de destino (obrigatorio para deposito e transferencia)',
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Valor da operacao',
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
    404: {
      description: 'Conta nao encontrada',
      type: 'number',
    },
  },
};
