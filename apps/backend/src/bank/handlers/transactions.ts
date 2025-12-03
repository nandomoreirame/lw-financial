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
 * Handler for GET /transactions endpoint
 * Returns the 20 most recent transactions for the authenticated user
 * Transactions are ordered by creation date (most recent first)
 */
export async function transactionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<TransactionResponse[] | void> {
  // Type assertion: authenticateRequest middleware ensures request.user exists
  const authRequest = request as AuthenticatedRequest;
  try {
    // Get userId from authenticated request (from JWT token)
    const userId = authRequest.user.userId;

    if (!userId) {
      return reply
        .status(401)
        .send({ error: 'User information not found in token' });
    }

    // Get user's bank accounts to find all related transactions
    const userAccounts = await prisma.bankAccount.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    const accountIds = userAccounts.map((account) => account.id);

    // Build query conditions
    // Include transactions where:
    // 1. userId matches (direct user association) - this is the primary way
    // 2. originAccountId matches user's accounts (withdrawals/transfers from user's accounts)
    // 3. destinationAccountId matches user's accounts (deposits/transfers to user's accounts)
    const whereConditions: Array<{
      userId?: string;
      originAccountId?: { in: string[] };
      destinationAccountId?: { in: string[] };
    }> = [];

    // Always include userId condition
    whereConditions.push({ userId: userId });

    // Add account-based conditions if user has accounts
    if (accountIds.length > 0) {
      whereConditions.push({ originAccountId: { in: accountIds } });
      whereConditions.push({ destinationAccountId: { in: accountIds } });
    }

    // Fetch transactions for the authenticated user
    // Limit to 20 most recent, ordered by createdAt DESC
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: whereConditions,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      authRequest.log.info(
        {
          userId,
          accountCount: accountIds.length,
          accountIds: accountIds,
          transactionCount: transactions.length,
          whereConditionsCount: whereConditions.length,
        },
        'Transactions query result'
      );
    }

    // Transform Prisma transactions to API response format
    const response: TransactionResponse[] = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount.toString(),
      originAccountId: tx.originAccountId,
      destinationAccountId: tx.destinationAccountId,
      userId: tx.userId,
      createdAt: tx.createdAt.toISOString(),
    }));

    // Get user's current balance
    const currentBalance = await accountService.getBalanceByUserId(userId);

    // Add initial balance transaction if balance is greater than zero
    // This represents the starting balance before any transactions
    if (currentBalance > 0) {
      // Calculate initial balance: current balance minus net effect of all transactions
      // For deposits to user's account: add to balance
      // For withdrawals from user's account: subtract from balance
      // For transfers: consider if user's account is origin (subtract) or destination (add)
      let transactionNetEffect = 0;
      transactions.forEach((tx) => {
        const amount = Number(tx.amount);
        if (tx.type === 'DEPOSIT') {
          // Deposit increases balance
          if (
            accountIds.length > 0 &&
            tx.destinationAccountId &&
            accountIds.includes(tx.destinationAccountId)
          ) {
            transactionNetEffect += amount;
          }
        } else if (tx.type === 'WITHDRAW') {
          // Withdrawal decreases balance
          if (
            accountIds.length > 0 &&
            tx.originAccountId &&
            accountIds.includes(tx.originAccountId)
          ) {
            transactionNetEffect -= amount;
          }
        } else if (tx.type === 'TRANSFER') {
          // Transfer: subtract if user's account is origin, add if destination
          if (accountIds.length > 0) {
            if (tx.originAccountId && accountIds.includes(tx.originAccountId)) {
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

      // Initial balance = current balance - net effect of all transactions
      const initialBalance = currentBalance - transactionNetEffect;

      // Only add initial balance if it's greater than zero
      if (initialBalance > 0) {
        // Get the oldest transaction date to set initial balance before it
        const oldestTransactionDate =
          transactions.length > 0
            ? new Date(transactions[transactions.length - 1].createdAt)
            : new Date();

        // Set initial balance date to 1 second before the oldest transaction
        // or current date if no transactions exist
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

        // Add initial balance at the end (oldest position) since we sort by DESC
        // When sorted DESC, this will appear after all other transactions
        response.push(initialBalanceTransaction);
      }
    }

    // Sort by createdAt DESC (most recent first)
    // Initial balance will be at the end (oldest)
    response.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return reply.status(200).send(response);
  } catch (error) {
    // Log unexpected errors
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
    'Retorna o histórico de transações do usuário autenticado. Retorna até 20 transações mais recentes, ordenadas por data de criação (mais recente primeiro). O userId é extraído do token JWT.',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  response: {
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
