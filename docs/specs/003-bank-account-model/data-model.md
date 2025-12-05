# Data Model: Contas Bancárias e Transações

**Feature**: 003-bank-account-model
**Date**: 2025-12-02
**Phase**: 1 - Design & Contracts

## Overview

Este documento define a estrutura de dados para os modelos `BankAccount` e `Transaction` que serão adicionados ao Prisma schema. Os modelos suportam todas as operações bancárias da Fase 2: criação de contas, consulta de saldo, depósitos, saques e transferências.

## Entities

### BankAccount

Representa uma conta bancária no sistema. Armazena informações de saldo e permite associação opcional com usuários autenticados para auditoria.

**Prisma Model**:

```prisma
model BankAccount {
  id        String   @id @default(cuid())
  balance  Decimal  @db.Decimal(10, 2)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  originTransactions      Transaction[] @relation("OriginAccount")
  destinationTransactions Transaction[] @relation("DestinationAccount")

  @@index([userId])
  @@map("bank_account")
}
```

**Fields**:

| Field       | Type           | Required | Description                                                      |
| ----------- | -------------- | -------- | ---------------------------------------------------------------- |
| `id`        | String (cuid)  | Yes      | Identificador único usado diretamente nas APIs como `account_id` |
| `balance`   | Decimal(10, 2) | Yes      | Saldo atual da conta (10 dígitos totais, 2 decimais)             |
| `userId`    | String?        | No       | ID do usuário associado (opcional, para auditoria)               |
| `user`      | User?          | No       | Relação opcional com modelo User (Fase 1)                        |
| `createdAt` | DateTime       | Yes      | Timestamp de criação (automático)                                |
| `updatedAt` | DateTime       | Yes      | Timestamp de última atualização (automático)                     |

**Relationships**:

- `originTransactions`: Transações onde esta conta é a origem (saques, transferências)
- `destinationTransactions`: Transações onde esta conta é o destino (depósitos, transferências)
- `user`: Relação opcional com User (nullable)

**Indexes**:

- Primary key em `id` (automático)
- Index em `userId` para queries eficientes de contas por usuário

**Validation Rules**:

- `balance` pode ser negativo (validação de regra de negócio na camada de aplicação)
- `userId` deve referenciar um User existente quando fornecido (integridade referencial)
- `id` é gerado automaticamente usando `cuid()`

**State Transitions**: N/A (modelo de dados simples, sem estados)

---

### Transaction

Representa uma transação financeira no sistema. Registra depósitos, saques e transferências com todas as informações necessárias para auditoria e histórico.

**Prisma Model**:

```prisma
enum TransactionType {
  DEPOSIT
  WITHDRAW
  TRANSFER
}

model Transaction {
  id                String          @id @default(cuid())
  type              TransactionType
  amount            Decimal         @db.Decimal(10, 2)
  originAccountId   String?
  originAccount     BankAccount?    @relation("OriginAccount", fields: [originAccountId], references: [id], onDelete: SetNull)
  destinationAccountId String?
  destinationAccount  BankAccount? @relation("DestinationAccount", fields: [destinationAccountId], references: [id], onDelete: SetNull)
  userId            String?
  user              User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt         DateTime        @default(now())

  @@index([originAccountId])
  @@index([destinationAccountId])
  @@index([createdAt])
  @@index([userId])
  @@map("transaction")
}
```

**Fields**:

| Field                  | Type                   | Required | Description                                                      |
| ---------------------- | ---------------------- | -------- | ---------------------------------------------------------------- |
| `id`                   | String (cuid)          | Yes      | Identificador único da transação                                 |
| `type`                 | TransactionType (Enum) | Yes      | Tipo: DEPOSIT, WITHDRAW, ou TRANSFER                             |
| `amount`               | Decimal(10, 2)         | Yes      | Valor da transação (sempre positivo)                             |
| `originAccountId`      | String?                | No       | ID da conta de origem (para WITHDRAW e TRANSFER)                 |
| `originAccount`        | BankAccount?           | No       | Relação com conta de origem                                      |
| `destinationAccountId` | String?                | No       | ID da conta de destino (para DEPOSIT e TRANSFER)                 |
| `destinationAccount`   | BankAccount?           | No       | Relação com conta de destino                                     |
| `userId`               | String?                | No       | ID do usuário que realizou a operação (opcional, para auditoria) |
| `user`                 | User?                  | No       | Relação opcional com User                                        |
| `createdAt`            | DateTime               | Yes      | Timestamp de criação (automático)                                |

**Enum Values**:

| Value      | Description                | Required Fields                                     |
| ---------- | -------------------------- | --------------------------------------------------- |
| `DEPOSIT`  | Depósito em conta          | `destinationAccountId`, `amount`                    |
| `WITHDRAW` | Saque de conta             | `originAccountId`, `amount`                         |
| `TRANSFER` | Transferência entre contas | `originAccountId`, `destinationAccountId`, `amount` |

**Relationships**:

- `originAccount`: Conta bancária de origem (nullable, para saques e transferências)
- `destinationAccount`: Conta bancária de destino (nullable, para depósitos e transferências)
- `user`: Usuário que realizou a operação (opcional, para auditoria)

**Indexes**:

- Primary key em `id` (automático)
- Index em `originAccountId` para queries eficientes de transações de origem
- Index em `destinationAccountId` para queries eficientes de transações de destino
- Index em `createdAt` para ordenação eficiente de histórico
- Index em `userId` para queries de transações por usuário

**Validation Rules**:

- `amount` sempre positivo (direção determinada por tipo e papel da conta)
- `originAccountId` obrigatório para WITHDRAW e TRANSFER
- `destinationAccountId` obrigatório para DEPOSIT e TRANSFER
- Ambos `originAccountId` e `destinationAccountId` obrigatórios para TRANSFER
- `originAccountId` e `destinationAccountId` devem referenciar contas existentes quando fornecidos
- `userId` deve referenciar um User existente quando fornecido

**State Transitions**: N/A (transações são imutáveis após criação)

---

## Relationships Summary

### BankAccount ↔ Transaction

- **Type**: One-to-Many (bidirectional)
- **Description**: Uma conta bancária pode ter múltiplas transações como origem ou destino
- **Cardinality**:
  - BankAccount (1) → Transaction (many) [origin]
  - BankAccount (1) → Transaction (many) [destination]
- **Cascade**: `onDelete: SetNull` - Se conta for deletada, transações mantêm referência mas relação fica null

### BankAccount ↔ User

- **Type**: Many-to-One (optional)
- **Description**: Uma conta bancária pode estar associada a um usuário (opcional)
- **Cardinality**: BankAccount (many) → User (1, optional)
- **Cascade**: `onDelete: SetNull` - Se usuário for deletado, conta mantém referência mas relação fica null

### Transaction ↔ User

- **Type**: Many-to-One (optional)
- **Description**: Uma transação pode estar associada ao usuário que a realizou (opcional)
- **Cardinality**: Transaction (many) → User (1, optional)
- **Cascade**: `onDelete: SetNull` - Se usuário for deletado, transação mantém referência mas relação fica null

---

## Data Integrity Rules

1. **Referential Integrity**:
   - `BankAccount.userId` deve referenciar `User.id` existente quando fornecido
   - `Transaction.originAccountId` deve referenciar `BankAccount.id` existente quando fornecido
   - `Transaction.destinationAccountId` deve referenciar `BankAccount.id` existente quando fornecido
   - `Transaction.userId` deve referenciar `User.id` existente quando fornecido

2. **Business Rules** (aplicadas na camada de aplicação, não no banco):
   - Saldo não pode ficar negativo (validação na aplicação)
   - Transações são imutáveis após criação
   - `amount` sempre positivo (validação na aplicação)

3. **Uniqueness**:
   - `BankAccount.id` é único (primary key)
   - `Transaction.id` é único (primary key)

---

## Performance Considerations

### Query Patterns

1. **Consulta de Saldo por Account ID** (SC-002: <50ms):
   - Query: `SELECT balance FROM bank_account WHERE id = ?`
   - Index: Primary key em `id` (otimizado automaticamente)

2. **Histórico de Transações por Conta** (SC-004: <100ms para até 1000 transações):
   - Query: `SELECT * FROM transaction WHERE originAccountId = ? OR destinationAccountId = ? ORDER BY createdAt DESC`
   - Indexes: `originAccountId`, `destinationAccountId`, `createdAt`

3. **Todas as Transações Ordenadas** (SC-005: <200ms para até 10k transações):
   - Query: `SELECT * FROM transaction ORDER BY createdAt DESC`
   - Index: `createdAt`

4. **Reset (Delete All)** (SC-006: <500ms para até 1000 contas e 10k transações):
   - Queries: `DELETE FROM transaction`, `DELETE FROM bank_account`
   - Performance: PostgreSQL otimiza deletes em massa

---

## Migration Strategy

1. **Create Migration**:

   ```bash
   cd apps/backend
   bun run prisma:migrate --name add_bank_account_models
   ```

2. **Migration Steps**:
   - Criar enum `TransactionType`
   - Criar tabela `bank_account` com campos e índices
   - Criar tabela `transaction` com campos, índices e foreign keys
   - Adicionar foreign keys para User (opcional)

3. **Rollback**: Migration reversível via Prisma migrate

---

## Testing Considerations

### Unit Tests

- Validação de criação de BankAccount com e sem userId
- Validação de criação de Transaction com diferentes tipos
- Validação de relacionamentos opcionais

### Integration Tests

- Criação de conta e consulta de saldo
- Criação de transações (deposit, withdraw, transfer)
- Queries de histórico de transações
- Integridade referencial (tentar criar transação com conta inexistente)
- Performance de queries (validar SC-002, SC-004, SC-005)

---

## Future Considerations

- **Soft Deletes**: Adicionar campo `deletedAt` se necessário no futuro
- **Audit Trail**: Campos adicionais de auditoria podem ser adicionados
- **Multi-currency**: Campo `currency` pode ser adicionado se necessário
- **Account Status**: Enum `AccountStatus` (ACTIVE, BLOCKED, etc.) pode ser adicionado
