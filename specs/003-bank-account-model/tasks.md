# Implementation Tasks: Modelagem de Dados de Contas Bancárias

**Feature**: 003-bank-account-model
**Branch**: `003-bank-account-model`
**Date**: 2025-12-02
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

Este documento lista todas as tarefas necessárias para implementar os modelos de dados `BankAccount` e `Transaction` no Prisma schema. As tarefas estão organizadas por fases, permitindo implementação incremental e testes independentes.

## Implementation Strategy

**MVP Scope**: Implementar User Story 1 (BankAccount model) primeiro, pois é pré-requisito para todas as operações bancárias.

**Incremental Delivery**:

1. Phase 1-2: Setup e Foundational (pré-requisitos)
2. Phase 3: User Story 1 - BankAccount model (base para todas as operações)
3. Phase 4: User Story 2 - Transaction model (histórico e auditoria)
4. Phase 5: Polish (testes de performance, validações finais)

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1: BankAccount) ──┐
    ↓                         │
Phase 4 (US2: Transaction) ←─┘ (depende de BankAccount)
    ↓
Phase 5 (Polish)
```

**Story Completion Order**:

1. **US1** (P1): BankAccount - Base fundamental, deve ser completada primeiro
2. **US2** (P1): Transaction - Depende de BankAccount para relacionamentos

## Parallel Execution Opportunities

- T001-T002: Setup tasks podem ser feitas em paralelo se diferentes arquivos
- T003-T004: Foundational tasks podem ser paralelizadas
- T005-T006: Enum e modelo BankAccount podem ser feitos em paralelo (diferentes seções do schema)
- T007-T008: Testes e migration podem ser feitos em paralelo após modelos criados

---

## Phase 1: Setup

**Goal**: Preparar ambiente e estrutura para adicionar modelos ao schema Prisma.

**Independent Test**: Verificar que schema Prisma existe e está acessível, branch correta está ativa.

- [x] T001 Verificar que branch `003-bank-account-model` está ativa em `/home/nandomoreira/development/playground/teste-LW-TECNOLOGIA`
- [x] T002 Verificar que arquivo `apps/backend/prisma/schema.prisma` existe e está acessível
- [x] T003 Verificar que modelo `User` existe no schema em `apps/backend/prisma/schema.prisma` (dependência da Fase 1)

---

## Phase 2: Foundational

**Goal**: Adicionar enum TransactionType que será usado pelo modelo Transaction.

**Independent Test**: Enum pode ser criado e referenciado no schema sem erros de sintaxe.

- [x] T004 Adicionar enum `TransactionType` com valores `DEPOSIT`, `WITHDRAW`, `TRANSFER` em `apps/backend/prisma/schema.prisma` após a definição do datasource

---

## Phase 3: User Story 1 - Armazenar Informações de Contas Bancárias

**Story Goal**: Implementar modelo BankAccount para armazenar informações de contas bancárias com saldo e timestamps.

**Independent Test**: Criar um registro de BankAccount no banco de dados e verificar que todos os campos obrigatórios são armazenados corretamente (id, balance, createdAt, updatedAt).

**Acceptance Criteria**:

- ✅ Conta pode ser criada com id único (cuid), saldo inicial e timestamps
- ✅ Conta pode ser consultada retornando id e saldo atual
- ✅ Saldo pode ser atualizado e updatedAt é modificado automaticamente

- [x] T005 [P] [US1] Adicionar modelo `BankAccount` em `apps/backend/prisma/schema.prisma` com campos: id (String @id @default(cuid())), balance (Decimal @db.Decimal(10, 2)), userId (String? opcional), createdAt (DateTime @default(now())), updatedAt (DateTime @updatedAt)
- [x] T006 [US1] Adicionar relação opcional `user` no modelo `BankAccount` em `apps/backend/prisma/schema.prisma` referenciando `User` com `onDelete: SetNull` e nome da relação "BankAccounts"
- [x] T007 [US1] Adicionar relações `originTransactions` e `destinationTransactions` no modelo `BankAccount` em `apps/backend/prisma/schema.prisma` como arrays de `Transaction[]` com nomes "OriginAccount" e "DestinationAccount"
- [x] T008 [US1] Adicionar índice `@@index([userId])` no modelo `BankAccount` em `apps/backend/prisma/schema.prisma`
- [x] T009 [US1] Adicionar mapeamento `@@map("bank_account")` no modelo `BankAccount` em `apps/backend/prisma/schema.prisma`
- [x] T010 [US1] Adicionar relação `bankAccounts` no modelo `User` em `apps/backend/prisma/schema.prisma` como `BankAccount[] @relation("BankAccounts")`

---

## Phase 4: User Story 2 - Rastrear Histórico de Transações

**Story Goal**: Implementar modelo Transaction para rastrear todas as transações financeiras (depósitos, saques, transferências) com tipo, valor, contas envolvidas e timestamps.

**Independent Test**: Criar uma transação e verificar que tipo, valores, contas envolvidas e timestamps são armazenados corretamente.

**Acceptance Criteria**:

- ✅ Transação pode ser criada com tipo (DEPOSIT, WITHDRAW, TRANSFER), valor e contas envolvidas
- ✅ Histórico de transações pode ser consultado ordenado por data de criação
- ✅ Transferências registram tanto conta de origem quanto de destino

- [x] T011 [P] [US2] Adicionar modelo `Transaction` em `apps/backend/prisma/schema.prisma` com campos: id (String @id @default(cuid())), type (TransactionType enum), amount (Decimal @db.Decimal(10, 2)), originAccountId (String? opcional), destinationAccountId (String? opcional), userId (String? opcional), createdAt (DateTime @default(now()))
- [x] T012 [US2] Adicionar relação `originAccount` no modelo `Transaction` em `apps/backend/prisma/schema.prisma` referenciando `BankAccount` com nome "OriginAccount" e `onDelete: SetNull`
- [x] T013 [US2] Adicionar relação `destinationAccount` no modelo `Transaction` em `apps/backend/prisma/schema.prisma` referenciando `BankAccount` com nome "DestinationAccount" e `onDelete: SetNull`
- [x] T014 [US2] Adicionar relação opcional `user` no modelo `Transaction` em `apps/backend/prisma/schema.prisma` referenciando `User` com nome "Transactions" e `onDelete: SetNull`
- [x] T015 [US2] Adicionar índices `@@index([originAccountId])`, `@@index([destinationAccountId])`, `@@index([createdAt])`, `@@index([userId])` no modelo `Transaction` em `apps/backend/prisma/schema.prisma`
- [x] T016 [US2] Adicionar mapeamento `@@map("transaction")` no modelo `Transaction` em `apps/backend/prisma/schema.prisma`
- [x] T017 [US2] Adicionar relação `transactions` no modelo `User` em `apps/backend/prisma/schema.prisma` como `Transaction[] @relation("Transactions")`

---

## Phase 5: Migration & Testing

**Goal**: Gerar migration do Prisma e criar testes de integração para validar os modelos.

**Independent Test**: Migration aplicada com sucesso, testes de integração passam validando criação e consulta de modelos.

- [x] T018 Executar `bun run prisma:migrate dev --name add_bank_account_models` em `apps/backend` para gerar e aplicar migration
- [x] T019 Verificar que migration foi criada em `apps/backend/prisma/migrations/[timestamp]_add_bank_account_models/migration.sql` com CREATE TYPE para enum, CREATE TABLE para bank_account e transaction, e todos os índices
- [x] T020 Executar `bun run prisma:generate` em `apps/backend` para gerar Prisma Client atualizado
- [x] T021 Criar arquivo `apps/backend/tests/integration/bank-account-model.test.ts` com testes de integração para criação de BankAccount sem userId
- [x] T022 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para criação de BankAccount com userId
- [x] T023 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para consulta de saldo por account_id (validar SC-002: <50ms)
- [x] T024 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para criação de Transaction tipo DEPOSIT
- [x] T025 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para criação de Transaction tipo WITHDRAW
- [x] T026 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para criação de Transaction tipo TRANSFER com origem e destino
- [x] T027 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para query de histórico de transações por conta (validar SC-004: <100ms para até 1000 transações)
- [x] T028 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para query de todas as transações ordenadas por createdAt (validar SC-005: <200ms para até 10k transações)
- [x] T029 [P] Adicionar teste em `apps/backend/tests/integration/bank-account-model.test.ts` para integridade referencial (tentar criar Transaction com conta inexistente deve falhar)
- [x] T030 Executar `bun test apps/backend/tests/integration/bank-account-model.test.ts` e verificar que todos os testes passam

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Validações finais, documentação e verificação de critérios de sucesso.

**Independent Test**: Todos os critérios de sucesso (SC-001 a SC-009) são atendidos.

- [x] T031 Verificar que schema Prisma em `apps/backend/prisma/schema.prisma` segue convenções do projeto (cuid policy, naming conventions) - ✓ Todos os modelos usam @id @default(cuid()), naming conventions seguem padrão (PascalCase para modelos, snake_case para tabelas)
- [x] T032 Validar que modelo `BankAccount` não conflita com modelo `Account` existente (OAuth) em `apps/backend/prisma/schema.prisma` - ✓ Modelos são distintos: Account (OAuth) e BankAccount (bancário), sem conflitos
- [x] T033 Verificar que todos os índices necessários estão presentes nos modelos para performance (SC-002, SC-004, SC-005) - ✓ BankAccount: @@index([userId]), Transaction: @@index([originAccountId]), @@index([destinationAccountId]), @@index([createdAt]), @@index([userId])
- [x] T034 Validar que relacionamentos opcionais com User funcionam corretamente (contas e transações podem existir sem userId) - ✓ BankAccount.userId: String?, Transaction.userId: String?, ambos opcionais
- [x] T035 Executar validação de performance: query de saldo em <50ms (SC-002) em `apps/backend/tests/integration/bank-account-model.test.ts` - ✓ Validado no teste T023
- [x] T036 Executar validação de performance: histórico de transações em <100ms para 1000 transações (SC-004) em `apps/backend/tests/integration/bank-account-model.test.ts` - ✓ Validado no teste T027
- [x] T037 Executar validação de performance: todas as transações ordenadas em <200ms para 10k transações (SC-005) em `apps/backend/tests/integration/bank-account-model.test.ts` - ✓ Validado no teste T028
- [x] T038 Verificar que migration pode ser revertida (rollback) sem erros - ✓ Script de rollback manual criado em `apps/backend/prisma/migrations/20251202191214_add_bank_account_models/rollback.sql`, migration validada e pode ser revertida via `prisma migrate reset` ou script manual
- [x] T039 Validar que Prisma Client gerado em `apps/backend/node_modules/.prisma/client` contém tipos TypeScript corretos para BankAccount e Transaction - ✓ Prisma Client gerado com sucesso, BankAccount e Transaction disponíveis

---

## Task Summary

**Total Tasks**: 39

**Tasks by Phase**:

- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 1 task
- Phase 3 (US1 - BankAccount): 6 tasks
- Phase 4 (US2 - Transaction): 7 tasks
- Phase 5 (Migration & Testing): 13 tasks
- Phase 6 (Polish): 9 tasks

**Tasks by User Story**:

- US1 (BankAccount): 6 tasks
- US2 (Transaction): 7 tasks
- Cross-cutting (Setup, Foundational, Testing, Polish): 26 tasks

**Parallel Opportunities**: 15 tasks marcadas com [P]

**Independent Test Criteria**:

- **US1**: Criar registro de BankAccount e verificar campos obrigatórios armazenados corretamente
- **US2**: Criar transação e verificar tipo, valores, contas e timestamps armazenados corretamente

**Suggested MVP Scope**: Phase 1-3 (Setup + Foundational + US1) = 10 tasks

---

## Notes

- Todas as tasks seguem o formato checklist obrigatório: `- [ ] [TaskID] [Labels] Description with file path`
- Tasks marcadas com [P] podem ser executadas em paralelo
- Tasks marcadas com [US1] ou [US2] pertencem às respectivas user stories
- File paths são absolutos ou relativos ao repositório root
- Migration deve ser testada em ambiente de desenvolvimento antes de produção
