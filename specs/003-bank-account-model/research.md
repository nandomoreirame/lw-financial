# Research: Modelagem de Dados de Contas Bancárias

**Feature**: 003-bank-account-model
**Date**: 2025-12-02
**Phase**: 0 - Outline & Research

## Overview

Esta pesquisa resolve todas as decisões técnicas necessárias para implementar os modelos de dados BankAccount e Transaction no Prisma schema, garantindo que todas as ambiguidades identificadas na especificação sejam resolvidas antes do design.

## Research Findings

### 1. Nomenclatura do Modelo de Conta Bancária

**Decision**: Criar modelo `BankAccount` separado do modelo `Account` existente (OAuth)

**Rationale**:

- O schema Prisma já possui um modelo `Account` usado para autenticação OAuth (provider accounts)
- Criar um modelo separado `BankAccount` mantém separação clara de conceitos
- Evita conflitos de nomenclatura e confusão entre contas OAuth e contas bancárias
- Segue princípio de responsabilidade única (SRP)
- Facilita manutenção e evolução independente dos modelos

**Alternatives Considered**:

- Renomear `Account` para `OAuthAccount` e usar `Account` para contas bancárias: Rejeitado por ser uma mudança breaking que afeta código existente
- Usar nome alternativo como `FinancialAccount`: Rejeitado por ser menos descritivo que `BankAccount`

**References**:

- Prisma Schema existente: `apps/backend/prisma/schema.prisma`
- Convenções de nomenclatura do projeto

---

### 2. Identificador de Conta para APIs

**Decision**: `account_id` é o mesmo que o `id` (cuid) - usar o id diretamente nas APIs

**Rationale**:

- Simplifica o modelo de dados eliminando campo redundante
- Cuid já é URL-safe e pode ser usado diretamente em APIs
- Evita necessidade de mapeamento entre identificadores
- Mantém consistência com outros modelos do sistema
- Reduz complexidade e possíveis bugs de sincronização

**Alternatives Considered**:

- Campo `account_id` separado (string única): Rejeitado por adicionar complexidade desnecessária
- Campo `account_id` numérico: Rejeitado por não seguir padrão cuid do projeto

**References**:

- Prisma ID Generation Policy no schema existente
- FR-001 da especificação

---

### 3. Tipo de Dados para Valores Monetários

**Decision**: Usar `Decimal` do Prisma com precisão `@db.Decimal(10, 2)` (10 dígitos totais, 2 decimais)

**Rationale**:

- `Decimal` evita erros de arredondamento comuns em `Float`/`Double`
- Precisão de 2 casas decimais é padrão para moedas (centavos)
- 10 dígitos totais permite valores até 99.999.999,99 (suficiente para sistema bancário)
- PostgreSQL suporta nativamente DECIMAL com precisão especificada
- Prisma mapeia corretamente para `Decimal` do JavaScript mantendo precisão

**Alternatives Considered**:

- `Float` ou `Double`: Rejeitado por problemas de precisão em cálculos financeiros
- `Int` armazenando centavos: Rejeitado por complicar lógica de negócio e queries
- `Decimal(19, 4)`: Considerado mas rejeitado por ser excessivo para este caso de uso

**References**:

- Prisma Decimal Type: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#decimal
- PostgreSQL DECIMAL: https://www.postgresql.org/docs/current/datatype-numeric.html
- Best practices para valores monetários em bancos de dados

---

### 4. Representação do Tipo de Transação

**Decision**: Usar Enum do Prisma `enum TransactionType { DEPOSIT, WITHDRAW, TRANSFER }`

**Rationale**:

- Enum garante type-safety e validação no nível do banco de dados
- Evita valores inválidos sendo inseridos
- Melhor performance em queries e índices
- Facilita manutenção e evolução (adicionar novos tipos é explícito)
- Integração nativa com TypeScript via Prisma Client

**Alternatives Considered**:

- String com valores fixos: Rejeitado por não ter validação no banco e permitir erros de digitação
- Int com constantes: Rejeitado por ser menos legível e mais propenso a erros

**References**:

- Prisma Enum Type: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#enum
- FR-008 da especificação

---

### 5. Relação Opcional com User

**Decision**: Campo `userId` nullable (String?) com relação opcional no Prisma

**Rationale**:

- Permite contas existirem independentemente de usuários (útil para testes e APIs simples)
- Mantém integridade referencial quando usuário é fornecido
- Suporta evolução: contas podem ser criadas sem usuário e associadas depois
- Alinha com FR-005 e FR-006 que especificam associação opcional
- Facilita testes de integração sem necessidade de criar usuários

**Alternatives Considered**:

- Sem relação com User (apenas lógica na aplicação): Rejeitado por perder integridade referencial e queries eficientes
- Campo `userId` obrigatório: Rejeitado por violar FR-005 que permite contas independentes

**References**:

- Prisma Optional Relations: https://www.prisma.io/docs/concepts/components/prisma-schema/relations/optional-relations
- FR-005, FR-006 da especificação

---

### 6. Índices para Performance

**Decision**: Adicionar índices em campos frequentemente consultados

**Rationale**:

- Query de saldo por account_id deve ser <50ms (SC-002)
- Histórico de transações por conta deve ser <100ms para até 1000 transações (SC-004)
- Índices em `originAccountId` e `destinationAccountId` melhoram queries de histórico
- Índice em `createdAt` melhora ordenação de transações

**Indexes to Add**:

- `BankAccount.id` (já indexado como primary key)
- `Transaction.originAccountId` (para queries de transações de origem)
- `Transaction.destinationAccountId` (para queries de transações de destino)
- `Transaction.createdAt` (para ordenação eficiente)

**References**:

- Prisma Indexes: https://www.prisma.io/docs/concepts/components/prisma-schema/indexes
- SC-002, SC-004, SC-005 da especificação

---

## Summary

Todas as decisões técnicas foram resolvidas com base em:

1. Convenções existentes do projeto (cuid policy, Prisma patterns)
2. Requisitos funcionais e critérios de sucesso da especificação
3. Best practices para modelagem de dados financeiros
4. Necessidade de flexibilidade para testes e evolução

Nenhuma ambiguidade crítica permanece. O design pode prosseguir para Phase 1.
