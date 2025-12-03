# Implementation Plan: User Logout and Transaction History

**Branch**: `006-logout-transactions` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-logout-transactions/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar funcionalidade de logout do usuário e histórico de transações no dashboard do frontend usando React Router 7 (Remix), React Query e ShadcnUI. A feature inclui: (1) Header com logo "LW Financial" e ícone bank.svg contendo botão de logout que remove token JWT do sessionStorage, limpa estado de autenticação e redireciona para login; (2) Seção de histórico de transações que exibe as 20 transações mais recentes com tipo em português ("Depósito", "Saque", "Transferência"), valor formatado (R$ 1.234,56), data/hora completa (03/12/2025 14:30), ordenadas por data decrescente; (3) Atualização automática do histórico após novas transações; (4) Estados de loading, erro e vazio apropriados. O backend será modificado para criar endpoint GET `/v1/transactions` que retorna histórico de transações do usuário autenticado (limitado a 20, ordenado por createdAt DESC).

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js (via Bun runtime)
**Primary Dependencies**: React Router 7 (Remix), React 19.1.1, Tailwind CSS v4.1.13, ShadcnUI, @tanstack/react-query, react-hook-form, zod, Fastify, Prisma ORM 5.7.1
**Storage**: PostgreSQL (via Prisma) para persistência de transações, sessionStorage para token JWT no frontend
**Testing**: Bun test - testes de integração e unitários para componentes de header, logout, histórico de transações e integração com API
**Target Platform**: Web browser (React Router 7 SSR/SPA)
**Project Type**: Web application (lw-financial frontend + backend modifications)
**Performance Goals**: Logout completo em <2 segundos (SC-001), histórico de transações carrega em <2 segundos para até 20 transações (SC-004), atualização do histórico em <1 segundo após nova transação (SC-005)
**Constraints**: Integração com backend Fastify existente, criação de novo endpoint `/v1/transactions`, uso de hook useAuth existente para logout, validação de autenticação via JWT, formatação de moeda brasileira (R$ 1.234,56), formatação de data/hora (03/12/2025 14:30), limite de 20 transações sem paginação
**Scale/Scope**: Sistema bancário frontend, header com logout, seção de histórico de transações no dashboard, suporte a exibição de até 20 transações recentes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

**Status**: PASS

**Analysis**:

- O projeto é um lw-financial Bun workspaces existente
- Frontend usa React Router 7 (Remix) já configurado
- Backend endpoint `/v1/transactions` precisa ser criado para retornar histórico de transações
- Feature adiciona componentes de header e histórico no frontend seguindo estrutura existente
- Hook useAuth já existe com função logout implementada, apenas precisa ser integrado no header
- Não há violações de princípios constitucionais detectadas
- A feature é focada e bem delimitada (logout e histórico de transações)
- Uso de ShadcnUI e Tailwind CSS v4 alinhado com guidelines do projeto
- React Query para gerenciamento de estado e cache de dados do histórico
- Modelo Transaction já existe no Prisma, apenas precisa endpoint de consulta

### Post-Design Check (After Phase 1)

**Status**: PASS

**Analysis**:

- Estrutura de código mantém organização existente do lw-financial frontend
- Componentes seguem padrão ShadcnUI já estabelecido no projeto
- Hook customizado para histórico de transações (use-transactions) seguindo padrão use-balance
- Uso de React Query alinhado com padrões do projeto (já usado em use-balance, use-deposit, use-withdraw)
- Header reutilizável seguindo padrão de componentes do projeto
- Formatação de data/hora usando biblioteca padrão (date-fns ou Intl.DateTimeFormat)
- Formatação de moeda usando função existente (format-currency.ts)
- Modificação mínima no backend (apenas novo handler e rota)
- Nenhuma complexidade desnecessária adicionada
- Feature bem isolada e testável independentemente
- Contratos API documentados seguindo padrão OpenAPI 3.0
- Backend endpoint alinha com padrão existente (balance endpoint)

## Project Structure

### Documentation (this feature)

```text
specs/006-logout-transactions/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/frontend/
├── app/
│   ├── routes/
│   │   └── dashboard.tsx               # Atualizar: adicionar header e seção de histórico
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── balance-card.tsx        # Já existe
│   │   │   ├── deposit-form.tsx        # Já existe
│   │   │   ├── withdraw-form.tsx       # Já existe
│   │   │   ├── header.tsx              # Novo: header com logo, ícone e botão logout
│   │   │   └── transaction-history.tsx # Novo: componente de histórico de transações
│   ├── hooks/
│   │   ├── use-balance.ts              # Já existe
│   │   ├── use-deposit.ts              # Já existe
│   │   ├── use-withdraw.ts             # Já existe
│   │   ├── use-auth.ts                 # Já existe (logout já implementado)
│   │   └── use-transactions.ts         # Novo: hook para histórico de transações
│   └── lib/
│       ├── api.ts                      # Atualizar: adicionar função getTransactions()
│       ├── format-currency.ts         # Já existe
│       └── format-date.ts              # Novo: formatação de data/hora
│
apps/backend/
├── src/
│   ├── bank/
│   │   ├── handlers/
│   │   │   ├── balance.ts              # Já existe
│   │   │   ├── event.ts                # Já existe
│   │   │   ├── reset.ts                # Já existe
│   │   │   └── transactions.ts         # Novo: handler para histórico de transações
│   │   └── routes.ts                   # Atualizar: adicionar rota GET /transactions
│   └── services/
│       └── account.service.ts          # Já existe (pode precisar método getTransactionsByUserId)
│
tests/
├── integration/
│   └── [backend transaction history tests]
└── unit/
    └── [frontend component tests]
```

**Structure Decision**: Web application structure mantida. Frontend adiciona componentes de header e histórico seguindo padrão existente. Backend adiciona novo handler e rota seguindo padrão de balance endpoint. Nenhuma mudança estrutural necessária.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
