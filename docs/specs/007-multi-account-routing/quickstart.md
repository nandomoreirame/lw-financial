# Quickstart: Multi-Account Management with Account Code Routing

**Feature**: Multi-Account Management with Account Code Routing
**Date**: 2025-12-03
**Phase**: 1 - Design & Contracts

## Overview

Este guia fornece instruções rápidas para implementar o sistema de múltiplas contas bancárias com códigos únicos e roteamento via URL.

## Prerequisites

- Node.js/Bun runtime instalado
- PostgreSQL rodando (via Docker Compose)
- Dependências do projeto instaladas (`bun install`)
- Feature 006-logout-transactions implementada (para histórico de transações)

## Quick Start Steps

### 1. Database Migration

#### 1.1. Atualizar Schema Prisma

Adicionar campo `code` ao modelo `BankAccount` em `apps/backend/prisma/schema.prisma`:

```prisma
model BankAccount {
  id        String   @id @default(cuid())
  code      String   @unique // NOVO
  balance   Decimal  @db.Decimal(10, 2)
  userId    String?
  user      User?    @relation("BankAccounts", fields: [userId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  originTransactions      Transaction[] @relation("OriginAccount")
  destinationTransactions Transaction[] @relation("DestinationAccount")

  @@index([userId])
  @@index([code]) // NOVO: Índice para busca rápida
  @@map("bank_account")
}
```

#### 1.2. Criar e Aplicar Migração

```bash
cd apps/backend
bun run prisma:migrate dev --name add_account_code
bun run prisma:generate
```

#### 1.3. Backfill Códigos para Contas Existentes (Opcional)

Se houver contas existentes sem código, criar script de backfill:

```typescript
// scripts/backfill-account-codes.ts
import { prisma } from '../src/db/client';
import { generateUniqueAccountCode } from '../src/bank/services/account-code.service';

async function backfillAccountCodes() {
  const accountsWithoutCode = await prisma.bankAccount.findMany({
    where: { code: null },
  });

  for (const account of accountsWithoutCode) {
    const code = await generateUniqueAccountCode();
    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { code },
    });
  }
}
```

### 2. Backend Implementation

#### 2.1. Criar Serviço de Geração de Código

Criar `apps/backend/src/bank/services/account-code.service.ts`:

```typescript
import { prisma } from '../../../db/client';

export function generateAccountCode(): string {
  const timestampPart = Date.now() % 10000;
  const firstPart = timestampPart.toString().padStart(4, '0');
  const counterPart = Math.floor(Date.now() / 1000) % 10;
  return `${firstPart}-${counterPart}`;
}

export async function generateUniqueAccountCode(
  maxRetries = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateAccountCode();
    const exists = await prisma.bankAccount.findUnique({ where: { code } });
    if (!exists) return code;

    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 10));
  }
  throw new Error('Failed to generate unique account code');
}
```

#### 2.2. Atualizar Serviço de Conta

Modificar `apps/backend/src/bank/services/account.service.ts` para gerar código ao criar conta:

```typescript
import { generateUniqueAccountCode } from './account-code.service';

export async function createBankAccount(
  userId: string,
  initialBalance: number = 0
) {
  const code = await generateUniqueAccountCode();

  return await prisma.bankAccount.create({
    data: {
      userId,
      balance: initialBalance,
      code, // NOVO
    },
  });
}
```

#### 2.3. Criar Handler para Buscar Conta por Código

Criar `apps/backend/src/bank/handlers/account-by-code.ts`:

```typescript
export async function getAccountByCodeHandler(
  request: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply
) {
  const { code } = request.params;
  const userId = (request as AuthenticatedRequest).user.userId;

  // Validar formato
  if (!/^\d{4}-\d$/.test(code)) {
    return reply.status(400).send({ error: 'Invalid account code format' });
  }

  const account = await prisma.bankAccount.findUnique({
    where: { code },
  });

  if (!account || account.userId !== userId) {
    return reply
      .status(404)
      .send({ error: 'Account not found or access denied' });
  }

  return reply.send(account);
}
```

#### 2.4. Adicionar Rota

Atualizar `apps/backend/src/bank/routes.ts`:

```typescript
fastify.get('/v1/accounts/:code', {
  preHandler: [authenticate],
  handler: getAccountByCodeHandler,
});
```

### 3. Frontend Implementation

#### 3.1. Configurar Rota Dinâmica

Atualizar `apps/frontend/app/routes.ts`:

```typescript
route('conta/:accountCode', 'routes/conta.$accountCode.tsx'),
```

#### 3.2. Criar Rota Dinâmica

Criar `apps/frontend/app/routes/conta.$accountCode.tsx`:

```typescript
export async function loader({ params, request }: Route.LoaderArgs) {
  const { accountCode } = params;

  // Validar formato
  if (!/^\d{4}-\d$/.test(accountCode)) {
    throw new Response('Invalid account code format', { status: 400 });
  }

  // Buscar conta (será feito no componente via React Query)
  return { accountCode };
}

export default function AccountRoute({ loaderData }: Route.ComponentProps) {
  const { accountCode } = loaderData;
  // Renderizar dashboard com conta específica
}
```

#### 3.3. Atualizar Sidebar

Modificar `apps/frontend/app/components/dashboard/dashboard-sidebar.tsx`:

```typescript
export function DashboardSidebar() {
  const { accountCode } = useParams();
  const navigate = useNavigate();
  const { data: accounts } = useAccounts();

  const handleAccountChange = (newCode: string) => {
    navigate(`/conta/${newCode}`);
  };

  // Se apenas uma conta, mostrar apenas código
  if (accounts?.length === 1) {
    return <div>{accounts[0].code}</div>;
  }

  return (
    <Select value={accountCode} onValueChange={handleAccountChange}>
      {/* Options */}
    </Select>
  );
}
```

#### 3.4. Atualizar Hooks

Modificar hooks para incluir `accountCode`:

- `use-balance.ts`: Aceitar `accountCode` como parâmetro
- `use-deposit.ts`: Incluir `accountCode` na requisição
- `use-withdraw.ts`: Incluir `accountCode` na requisição
- `use-transactions.ts`: Filtrar por `accountCode`

### 4. Testing

#### 4.1. Testar Geração de Código

```typescript
test('generates unique account code', async () => {
  const code1 = await generateUniqueAccountCode();
  const code2 = await generateUniqueAccountCode();
  expect(code1).toMatch(/^\d{4}-\d$/);
  expect(code2).not.toBe(code1);
});
```

#### 4.2. Testar Roteamento

```typescript
test('navigates to account route', () => {
  render(<DashboardSidebar />);
  fireEvent.change(selectElement, { target: { value: '1234-5' } });
  expect(window.location.pathname).toBe('/conta/1234-5');
});
```

## Common Issues

### Código Duplicado

**Problema**: Erro de constraint de unicidade ao criar conta.

**Solução**: O serviço já implementa retry automático. Se persistir, aumentar número de retries ou revisar algoritmo de geração.

### Conta Não Encontrada

**Problema**: Erro 404 ao acessar `/conta/[code]`.

**Soluções**:

1. Verificar que código existe no banco
2. Verificar que conta pertence ao usuário autenticado
3. Verificar formato do código na URL

### Sidebar Não Sincroniza com URL

**Problema**: Dropdown não reflete conta atual da URL.

**Solução**: Usar `useParams()` para ler código da URL e sincronizar com estado do dropdown.

## Next Steps

Após implementar os passos básicos:

1. Adicionar testes de integração para roteamento
2. Implementar validação de propriedade em todas as rotas
3. Adicionar loading states e error handling
4. Implementar redirecionamento para primeira conta quando `/conta/` sem código
5. Testar filtragem de transações por conta

## References

- [Spec](./spec.md) - Especificação completa da feature
- [Data Model](./data-model.md) - Modelo de dados atualizado
- [API Contracts](./contracts/) - Contratos de API
- [Research](./research.md) - Decisões técnicas e padrões
