# Implementation Plan: Modelagem de Dados de Contas Bancárias

**Branch**: `003-bank-account-model` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-bank-account-model/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar modelos de dados Prisma para contas bancárias (BankAccount) e transações (Transaction) no schema existente. A feature adiciona dois novos modelos ao Prisma schema com relacionamentos opcionais com User, suportando todas as operações bancárias da Fase 2 (depósitos, saques, transferências, consulta de saldo). Os modelos usam cuid() para identificadores, Decimal para valores monetários, e Enum para tipos de transação.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js (via Bun runtime)
**Primary Dependencies**: Prisma ORM 5.7.1, PostgreSQL, @prisma/client
**Storage**: PostgreSQL (via Prisma) - adiciona modelos BankAccount e Transaction ao schema existente
**Testing**: Bun test (ou Jest/Vitest) - testes de integração para validação de modelos e relacionamentos
**Target Platform**: Linux server (Node.js/Bun runtime)
**Project Type**: Web application (lw-financial backend)
**Performance Goals**: Query de saldo em <50ms (SC-002), histórico de transações em <100ms para até 1000 transações (SC-004), todas as transações ordenadas em <200ms para até 10k transações (SC-005)
**Constraints**: Deve seguir convenções existentes do schema (cuid policy, naming conventions), evitar conflito com modelo Account existente (OAuth), manter compatibilidade com User model da Fase 1
**Scale/Scope**: Suporta até 1000 contas e 10k transações para operações de reset em <500ms (SC-006), base para todas as operações bancárias da Fase 2

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

**Status**: PASS

**Analysis**:

- O projeto é um lw-financial Bun workspaces existente
- Backend usa Prisma ORM com PostgreSQL já configurado
- Feature adiciona modelos ao schema existente seguindo convenções (cuid policy)
- Não há violações de princípios constitucionais detectadas
- A feature é focada e bem delimitada (apenas modelagem de dados, sem lógica de negócio)
- Relacionamento opcional com User mantém flexibilidade para testes e produção

### Post-Design Check (After Phase 1)

**Status**: PASS

**Analysis**:

- Estrutura de código mantém organização existente do lw-financial
- Modelos seguem convenções do schema existente (cuid, naming, timestamps)
- Nomenclatura BankAccount evita conflito com Account (OAuth)
- Relacionamentos opcionais permitem flexibilidade sem comprometer integridade
- Tipos de dados apropriados (Decimal para valores monetários, Enum para tipos)
- Índices planejados para performance (queries por account_id, histórico)
- Nenhuma complexidade desnecessária adicionada
- Feature bem isolada e testável independentemente

## Project Structure

### Documentation (this feature)

```text
specs/003-bank-account-model/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/backend/
├── prisma/
│   ├── schema.prisma                    # Adicionar modelos BankAccount e Transaction
│   └── migrations/
│       └── [timestamp]_add_bank_models/  # Migration para novos modelos
└── tests/
    └── integration/
        └── bank-account-model.test.ts    # Testes de integração dos modelos
```

**Structure Decision**: LW Financial Bun workspaces existente. Backend em `apps/backend/` com Prisma ORM. Modelos adicionados ao schema.prisma existente seguindo convenções (cuid, naming, timestamps). Migration gerada automaticamente pelo Prisma. Testes de integração validam modelos e relacionamentos.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - Nenhuma violação detectada. Feature adiciona modelos simples ao schema existente seguindo padrões estabelecidos.
