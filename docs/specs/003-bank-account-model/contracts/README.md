# Contracts: Modelagem de Dados de Contas Bancárias

**Feature**: 003-bank-account-model
**Date**: 2025-12-02

## Overview

Esta feature implementa apenas a **modelagem de dados** (Prisma models) para contas bancárias e transações. Não implementa endpoints de API.

## API Contracts

Os contratos de API serão definidos nas seguintes features que implementam os endpoints:

- **US-005, US-006**: Consulta de saldo → `GET /balance?account_id=<id>`
- **US-007**: Criar conta com depósito → `POST /event` (tipo "deposit")
- **US-008**: Realizar depósito → `POST /event` (tipo "deposit")
- **US-009, US-010, US-011**: Operações de saque → `POST /event` (tipo "withdraw")
- **US-012, US-013, US-014**: Transferências → `POST /event` (tipo "transfer")
- **US-004**: Reset do sistema → `POST /reset`
- **US-020**: Histórico de transações → `GET /history?account_id=<id>`

## Data Contracts

### BankAccount Schema

```typescript
{
  id: string;           // cuid, usado como account_id nas APIs
  balance: Decimal;     // @db.Decimal(10, 2)
  userId?: string;      // Optional, referencia User.id
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Transaction Schema

```typescript
{
  id: string;                    // cuid
  type: "DEPOSIT" | "WITHDRAW" | "TRANSFER";
  amount: Decimal;               // @db.Decimal(10, 2), sempre positivo
  originAccountId?: string;      // Optional, para WITHDRAW e TRANSFER
  destinationAccountId?: string; // Optional, para DEPOSIT e TRANSFER
  userId?: string;               // Optional, referencia User.id
  createdAt: DateTime;
}
```

## Database Schema

Ver `data-model.md` para definição completa dos modelos Prisma.

## Notes

- Esta feature não define contratos de API REST/GraphQL
- Os modelos de dados suportam todas as operações necessárias para as APIs da Fase 2
- Validações de regras de negócio (ex: saldo não negativo) são implementadas na camada de aplicação, não no banco de dados
