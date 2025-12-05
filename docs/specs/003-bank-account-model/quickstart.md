# Quickstart: Modelagem de Dados de Contas Bancárias

**Feature**: 003-bank-account-model
**Date**: 2025-12-02

## Overview

Este guia fornece instruções passo a passo para implementar os modelos de dados `BankAccount` e `Transaction` no Prisma schema.

## Prerequisites

- Bun runtime instalado
- PostgreSQL rodando e configurado
- Variável de ambiente `DATABASE_URL` configurada
- Branch `003-bank-account-model` criada e ativa

## Implementation Steps

### 1. Adicionar Enum TransactionType ao Schema

Edite `apps/backend/prisma/schema.prisma` e adicione o enum após a definição do datasource:

```prisma
enum TransactionType {
  DEPOSIT
  WITHDRAW
  TRANSFER
}
```

### 2. Adicionar Modelo BankAccount

Adicione o modelo `BankAccount` ao schema (após o modelo `Verification`):

```prisma
model BankAccount {
  id        String   @id @default(cuid())
  balance  Decimal  @db.Decimal(10, 2)
  userId    String?
  user      User?    @relation("BankAccounts", fields: [userId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  originTransactions      Transaction[] @relation("OriginAccount")
  destinationTransactions Transaction[] @relation("DestinationAccount")

  @@index([userId])
  @@map("bank_account")
}
```

### 3. Adicionar Modelo Transaction

Adicione o modelo `Transaction` após `BankAccount`:

```prisma
model Transaction {
  id                String          @id @default(cuid())
  type              TransactionType
  amount            Decimal         @db.Decimal(10, 2)
  originAccountId   String?
  originAccount     BankAccount?    @relation("OriginAccount", fields: [originAccountId], references: [id], onDelete: SetNull)
  destinationAccountId String?
  destinationAccount  BankAccount? @relation("DestinationAccount", fields: [destinationAccountId], references: [id], onDelete: SetNull)
  userId            String?
  user              User?           @relation("Transactions", fields: [userId], references: [id], onDelete: SetNull)
  createdAt         DateTime        @default(now())

  @@index([originAccountId])
  @@index([destinationAccountId])
  @@index([createdAt])
  @@index([userId])
  @@map("transaction")
}
```

### 4. Atualizar Modelo User

Adicione as relações no modelo `User` existente:

```prisma
model User {
  // ... campos existentes ...
  bankAccounts BankAccount[] @relation("BankAccounts")
  transactions Transaction[] @relation("Transactions")
  // ... resto do modelo ...
}
```

### 5. Gerar Migration

Execute o comando para criar a migration:

```bash
cd apps/backend
bun run prisma:migrate dev --name add_bank_account_models
```

Isso irá:

- Criar a migration SQL
- Aplicar a migration ao banco de dados
- Gerar o Prisma Client atualizado

### 6. Verificar Migration

Confirme que a migration foi criada em `apps/backend/prisma/migrations/[timestamp]_add_bank_account_models/migration.sql`

A migration deve conter:

- CREATE TYPE para enum `TransactionType`
- CREATE TABLE para `bank_account`
- CREATE TABLE para `transaction`
- CREATE INDEX para todos os índices especificados
- ALTER TABLE para adicionar foreign keys

### 7. Gerar Prisma Client

Se necessário, gere o Prisma Client:

```bash
cd apps/backend
bun run prisma:generate
```

### 8. Criar Teste de Integração

Crie `apps/backend/tests/integration/bank-account-model.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('BankAccount Model', () => {
  beforeAll(async () => {
    // Setup se necessário
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a bank account without user', async () => {
    const account = await prisma.bankAccount.create({
      data: {
        balance: 1000.0,
      },
    });

    expect(account.id).toBeDefined();
    expect(account.balance.toString()).toBe('1000.00');
    expect(account.userId).toBeNull();
  });

  it('should create a transaction of type DEPOSIT', async () => {
    const account = await prisma.bankAccount.create({
      data: {
        balance: 0,
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        type: 'DEPOSIT',
        amount: 500.0,
        destinationAccountId: account.id,
      },
    });

    expect(transaction.type).toBe('DEPOSIT');
    expect(transaction.amount.toString()).toBe('500.00');
    expect(transaction.destinationAccountId).toBe(account.id);
    expect(transaction.originAccountId).toBeNull();
  });

  // Adicione mais testes conforme necessário
});
```

### 9. Executar Testes

```bash
cd apps/backend
bun test tests/integration/bank-account-model.test.ts
```

### 10. Validar Performance

Execute queries de teste para validar os critérios de sucesso:

```typescript
// SC-002: Query de saldo em <50ms
const start = Date.now();
const account = await prisma.bankAccount.findUnique({
  where: { id: accountId },
  select: { balance: true },
});
const duration = Date.now() - start;
console.assert(duration < 50, `Query took ${duration}ms, expected <50ms`);
```

## Verification Checklist

- [ ] Enum `TransactionType` criado no schema
- [ ] Modelo `BankAccount` adicionado ao schema
- [ ] Modelo `Transaction` adicionado ao schema
- [ ] Relações adicionadas ao modelo `User`
- [ ] Migration criada e aplicada
- [ ] Prisma Client gerado
- [ ] Testes de integração criados e passando
- [ ] Queries de performance validadas (SC-002, SC-004, SC-005)

## Troubleshooting

### Erro: "Relation does not exist"

- Verifique se as relações no modelo `User` foram adicionadas corretamente
- Certifique-se de que os nomes das relações correspondem em todos os modelos

### Erro: "Type TransactionType does not exist"

- Verifique se o enum foi definido antes dos modelos que o usam
- Execute `prisma:generate` novamente

### Migration falha

- Verifique se o banco de dados está acessível
- Verifique se há migrations pendentes: `bun run prisma:migrate status`
- Se necessário, reset o banco: `bun run prisma:migrate reset` (CUIDADO: apaga dados)

## Next Steps

Após completar esta feature:

1. As próximas features (US-005 a US-014) podem usar os modelos para implementar endpoints de API
2. Os modelos estão prontos para suportar todas as operações bancárias da Fase 2
3. Considere adicionar testes de performance mais abrangentes conforme o sistema escala

## References

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- `data-model.md` - Definição completa dos modelos
- `research.md` - Decisões técnicas e rationale
