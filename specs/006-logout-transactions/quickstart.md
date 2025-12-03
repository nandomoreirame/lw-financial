# Quickstart: User Logout and Transaction History

**Feature**: User Logout and Transaction History
**Date**: 2025-12-03
**Phase**: 1 - Design & Contracts

## Overview

Este guia fornece instruções rápidas para implementar a funcionalidade de logout do usuário e histórico de transações no dashboard.

## Prerequisites

- Node.js/Bun runtime instalado
- PostgreSQL rodando (via Docker Compose)
- Dependências do projeto instaladas (`bun install`)
- Usuário autenticado no sistema (token JWT válido)

## Implementation Steps

### Step 1: Criar Função de Formatação de Data/Hora

Criar `apps/frontend/app/lib/format-date.ts`:

```typescript
/**
 * Formata data e hora no formato brasileiro: DD/MM/YYYY HH:mm
 * @param date - Data a ser formatada
 * @returns String formatada (ex.: "03/12/2025 14:30")
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);

  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dateObj);

  return `${dateStr} ${timeStr}`;
}
```

### Step 2: Criar Função de Mapeamento de Tipos de Transação

Criar `apps/frontend/app/lib/transaction-types.ts`:

```typescript
/**
 * Mapeia tipo de transação para label em português
 */
export function getTransactionTypeLabel(
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'
): string {
  const labels = {
    DEPOSIT: 'Depósito',
    WITHDRAW: 'Saque',
    TRANSFER: 'Transferência',
  };
  return labels[type] || type;
}
```

### Step 3: Adicionar Função de API para Histórico de Transações

Atualizar `apps/frontend/app/lib/api.ts`:

```typescript
export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  amount: string;
  originAccountId: string | null;
  destinationAccountId: string | null;
  userId: string | null;
  createdAt: string;
}

export interface TransactionsResponse extends Array<Transaction> {}

/**
 * Busca histórico de transações do usuário autenticado
 * @returns Array com até 20 transações mais recentes
 */
export async function getTransactions(): Promise<TransactionsResponse> {
  const token = getToken();

  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(`${API_BASE_URL}/v1/transactions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Não autenticado');
    }
    throw new Error('Erro ao buscar histórico de transações');
  }

  const data = await response.json();
  return data as TransactionsResponse;
}
```

### Step 4: Criar Hook use-transactions

Criar `apps/frontend/app/hooks/use-transactions.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../lib/api';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    staleTime: 1000 * 30, // 30 segundos
  });
}
```

### Step 5: Criar Componente Header

Criar `apps/frontend/app/components/dashboard/header.tsx`:

```typescript
import { Button } from '@lw-financial/ui';
import { useAuth } from '../../hooks/use-auth';
import bankSvg from '../../../public/bank.svg';

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={bankSvg} alt="LW Financial" className="h-8 w-8" />
            <span className="text-xl font-bold">LW Financial</span>
          </div>
          <Button variant="outline" onClick={logout}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### Step 6: Criar Componente TransactionHistory

Criar `apps/frontend/app/components/dashboard/transaction-history.tsx`:

```typescript
import { useTransactions } from '../../hooks/use-transactions';
import { formatCurrency } from '../../lib/format-currency';
import { formatDateTime } from '../../lib/format-date';
import { getTransactionTypeLabel } from '../../lib/transaction-types';
import { Card, CardContent, CardHeader, CardTitle } from '@lw-financial/ui';

export function TransactionHistory() {
  const { data: transactions, isLoading, error } = useTransactions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            Erro ao carregar histórico de transações
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b pb-4 last:border-0"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {getTransactionTypeLabel(transaction.type)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(transaction.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(Number(transaction.amount))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 7: Criar Backend Handler de Transações

Criar `apps/backend/src/bank/handlers/transactions.ts`:

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types/auth';
import { prisma } from '../../db/prisma';

export async function transactionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authRequest = request as AuthenticatedRequest;
  const userId = authRequest.user.userId;

  if (!userId) {
    return reply
      .status(401)
      .send({ error: 'User information not found in token' });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return reply.status(200).send(transactions);
  } catch (error) {
    authRequest.log.error({ err: error }, 'Error fetching transactions');
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

export const transactionsSchema = {
  description:
    'Consulta o histórico de transações do usuário autenticado. Retorna as 20 transações mais recentes ordenadas por data de criação (mais recente primeiro).',
  tags: ['bank'],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Lista de transações',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER'] },
          amount: { type: 'string' },
          originAccountId: { type: 'string', nullable: true },
          destinationAccountId: { type: 'string', nullable: true },
          userId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
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
```

### Step 8: Adicionar Rota de Transações no Backend

Atualizar `apps/backend/src/bank/routes.ts`:

```typescript
import {
  transactionsHandler,
  transactionsSchema,
} from './handlers/transactions';

export async function bankRoutes(fastify: FastifyInstance) {
  // ... existing routes ...

  // GET /transactions - Query transaction history (requires authentication)
  fastify.get(
    '/transactions',
    {
      schema: transactionsSchema,
      preHandler: authenticateRequest,
    },
    transactionsHandler
  );
}
```

### Step 9: Atualizar Dashboard com Header e Histórico

Atualizar `apps/frontend/app/routes/dashboard.tsx`:

```typescript
import { Header } from '../components/dashboard/header';
import { TransactionHistory } from '../components/dashboard/transaction-history';

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  // ... existing code ...

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl p-4 space-y-6">
        {/* ... existing balance card and forms ... */}

        <TransactionHistory />
      </div>
    </div>
  );
}
```

### Step 10: Invalidar Cache Após Novas Transações

Atualizar hooks `use-deposit.ts` e `use-withdraw.ts` para invalidar cache de transações:

```typescript
import { useQueryClient } from '@tanstack/react-query';

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deposit,
    onSuccess: () => {
      // Invalidar cache de saldo e transações
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
```

## Testing

### Frontend Tests

```bash
cd apps/frontend
bun test tests/unit/header.test.tsx
bun test tests/unit/transaction-history.test.tsx
bun test tests/unit/use-transactions.test.ts
```

### Backend Tests

```bash
cd apps/backend
bun test tests/integration/transactions.test.ts
```

## Notes

- O header é reutilizável e pode ser usado em outras rotas protegidas
- O histórico de transações atualiza automaticamente após novas transações via React Query
- A formatação de data/hora usa Intl.DateTimeFormat nativo do JavaScript
- O endpoint de transações retorna no máximo 20 transações ordenadas por data decrescente
