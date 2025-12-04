import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../db/prisma';
import { AuthenticatedRequest } from '../../types/auth';
import { accountService } from '../services/account.service';

/**
 * Response structure for transactions query
 */
interface TransactionResponse {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'INITIAL_BALANCE';
  amount: string;
  originAccountId: string | null;
  destinationAccountId: string | null;
  userId: string | null;
  createdAt: string;
}

/**
 * Query parameters for transactions endpoint
 */
interface TransactionsQuery {
  accountCode?: string;
}

/**
 * Handler for GET /transactions endpoint
 * Returns the 20 most recent transactions for the authenticated user
 * Optionally filters by accountCode if provided
 * Transactions are ordered by creation date (most recent first)
 */
export async function transactionsHandler(
  request: FastifyRequest<{ Querystring: TransactionsQuery }>,
  reply: FastifyReply
): Promise<TransactionResponse[] | void> {
  const authRequest = request as AuthenticatedRequest;
  try {
    const userId = authRequest.user.userId;
    const { accountCode } = request.query;

    if (!userId) {
      return reply
        .status(401)
        .send({ error: 'User information not found in token' });
    }

    let targetAccountId: string | null = null;

    if (accountCode) {
      if (!/^\d{4}-\d$/.test(accountCode)) {
        return reply.status(400).send({
          error: 'Invalid account code format. Expected format: XXXX-X',
        });
      }

      try {
        const account = await accountService.getAccountByCode(
          accountCode,
          userId
        );
        targetAccountId = account.id;
      } catch (error) {
        if (error instanceof Error && error.name === 'AccountNotFoundError') {
          return reply.status(404).send({
            error: 'Account not found or access denied',
          });
        }
        throw error;
      }
    }

    const userAccounts = await prisma.bankAccount.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    const accountIds = userAccounts.map((account) => account.id);

    const whereConditions: Array<{
      userId?: string;
      originAccountId?: string | { in: string[] };
      destinationAccountId?: string | { in: string[] };
    }> = [];

    if (targetAccountId) {
      whereConditions.push({ originAccountId: targetAccountId });
      whereConditions.push({ destinationAccountId: targetAccountId });
    } else {
      whereConditions.push({ userId: userId });

      if (accountIds.length > 0) {
        whereConditions.push({ originAccountId: { in: accountIds } });
        whereConditions.push({ destinationAccountId: { in: accountIds } });
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: whereConditions,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    if (process.env.NODE_ENV === 'development') {
      authRequest.log.info(
        {
          userId,
          accountCode,
          targetAccountId,
          accountCount: accountIds.length,
          accountIds: accountIds,
          transactionCount: transactions.length,
          whereConditionsCount: whereConditions.length,
        },
        'Transactions query result'
      );
    }

    const response: TransactionResponse[] = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount.toString(),
      originAccountId: tx.originAccountId,
      destinationAccountId: tx.destinationAccountId,
      userId: tx.userId,
      createdAt: tx.createdAt.toISOString(),
    }));

    if (!targetAccountId) {
      const currentBalance = await accountService.getBalanceByUserId(userId);

      if (currentBalance > 0) {
        let transactionNetEffect = 0;
        transactions.forEach((tx) => {
          const amount = Number(tx.amount);
          if (tx.type === 'DEPOSIT') {
            if (
              accountIds.length > 0 &&
              tx.destinationAccountId &&
              accountIds.includes(tx.destinationAccountId)
            ) {
              transactionNetEffect += amount;
            }
          } else if (tx.type === 'WITHDRAW') {
            if (
              accountIds.length > 0 &&
              tx.originAccountId &&
              accountIds.includes(tx.originAccountId)
            ) {
              transactionNetEffect -= amount;
            }
          } else if (tx.type === 'TRANSFER') {
            if (accountIds.length > 0) {
              if (
                tx.originAccountId &&
                accountIds.includes(tx.originAccountId)
              ) {
                transactionNetEffect -= amount;
              }
              if (
                tx.destinationAccountId &&
                accountIds.includes(tx.destinationAccountId)
              ) {
                transactionNetEffect += amount;
              }
            }
          }
        });

        const initialBalance = currentBalance - transactionNetEffect;

        if (initialBalance > 0) {
          const oldestTransactionDate =
            transactions.length > 0
              ? new Date(transactions[transactions.length - 1].createdAt)
              : new Date();

          const initialBalanceDate = new Date(
            oldestTransactionDate.getTime() - 1000
          );

          const initialBalanceTransaction: TransactionResponse = {
            id: `initial-balance-${userId}`,
            type: 'INITIAL_BALANCE',
            amount: initialBalance.toString(),
            originAccountId: null,
            destinationAccountId: accountIds[0] || null,
            userId: userId,
            createdAt: initialBalanceDate.toISOString(),
          };

          response.push(initialBalanceTransaction);
        }
      }
    } else {
      const account = await accountService.getAccountByCode(
        accountCode!,
        userId
      );
      const accountBalance = Number(account.balance);

      if (accountBalance > 0) {
        let transactionNetEffect = 0;
        transactions.forEach((tx) => {
          const amount = Number(tx.amount);
          if (tx.type === 'DEPOSIT') {
            if (tx.destinationAccountId === targetAccountId) {
              transactionNetEffect += amount;
            }
          } else if (tx.type === 'WITHDRAW') {
            if (tx.originAccountId === targetAccountId) {
              transactionNetEffect -= amount;
            }
          } else if (tx.type === 'TRANSFER') {
            if (tx.originAccountId === targetAccountId) {
              transactionNetEffect -= amount;
            }
            if (tx.destinationAccountId === targetAccountId) {
              transactionNetEffect += amount;
            }
          }
        });

        const initialBalance = accountBalance - transactionNetEffect;

        if (initialBalance > 0) {
          const oldestTransactionDate =
            transactions.length > 0
              ? new Date(transactions[transactions.length - 1].createdAt)
              : new Date();

          const initialBalanceDate = new Date(
            oldestTransactionDate.getTime() - 1000
          );

          const initialBalanceTransaction: TransactionResponse = {
            id: `initial-balance-${targetAccountId}`,
            type: 'INITIAL_BALANCE',
            amount: initialBalance.toString(),
            originAccountId: null,
            destinationAccountId: targetAccountId,
            userId: userId,
            createdAt: initialBalanceDate.toISOString(),
          };

          response.push(initialBalanceTransaction);
        }
      }
    }

    response.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return reply.status(200).send(response);
  } catch (error) {
    authRequest.log.error(
      { err: error },
      'Unexpected error in transactions handler'
    );
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Swagger schema for transactions endpoint
 */
export const transactionsSchema = {
  description:
    'Retorna o histórico de transações do usuário autenticado. Retorna até 20 transações mais recentes, ordenadas por data de criação (mais recente primeiro). Pode ser filtrado por accountCode (formato XXXX-X) para retornar apenas transações de uma conta específica. O userId é extraído do token JWT.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      accountCode: {
        type: 'string',
        description:
          'Código da conta no formato XXXX-X para filtrar transações',
        pattern: '^\\d{4}-\\d$',
      },
    },
  },
  response: {
    400: {
      description: 'Formato de código de conta inválido',
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
    200: {
      description: 'Lista de transações do usuário',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'INITIAL_BALANCE'],
          },
          amount: { type: 'string' },
          originAccountId: { type: 'string' },
          destinationAccountId: { type: 'string' },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'type', 'amount', 'createdAt'],
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
