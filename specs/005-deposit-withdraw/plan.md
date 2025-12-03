# Implementation Plan: Dashboard Deposit and Withdraw Operations

**Branch**: `005-deposit-withdraw` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-deposit-withdraw/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar formulários de depósito e saque no dashboard do frontend usando React Router 7 (Remix), React Query e ShadcnUI. A feature inclui: (1) Formulário de depósito com validação de valores (R$ 0,01 a R$ 999.999,99, 2 casas decimais) que envia requisições POST para `/v1/event` com tipo "deposit"; (2) Formulário de saque com validação de valores e verificação de saldo suficiente que envia requisições POST para `/v1/event` com tipo "withdraw"; (3) Feedback visual durante processamento (botão desabilitado com spinner e mensagem "Processando..."); (4) Atualização automática do saldo após transações bem-sucedidas; (5) Mensagens de sucesso e erro apropriadas. O backend será modificado para identificar automaticamente a conta padrão do usuário autenticado a partir do token JWT, eliminando a necessidade de enviar accountId do frontend.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js (via Bun runtime)
**Primary Dependencies**: React Router 7 (Remix), React 19.1.1, Tailwind CSS v4.1.13, ShadcnUI, @tanstack/react-query, react-hook-form, zod, Fastify
**Storage**: PostgreSQL (via Prisma) para persistência de transações, sessionStorage para token JWT no frontend
**Testing**: Bun test - testes de integração e unitários para componentes de formulário, validações e integração com API
**Target Platform**: Web browser (React Router 7 SSR/SPA)
**Project Type**: Web application (lw-financial frontend + backend modifications)
**Performance Goals**: Depósito completo em <5 segundos (SC-001), saque completo em <5 segundos (SC-002), feedback de erro em <2 segundos (SC-005), atualização de saldo em <1 segundo após transação (SC-006)
**Constraints**: Integração com backend Fastify existente (`/v1/event`), modificação do backend para identificar conta automaticamente via JWT, validação de valores no frontend (R$ 0,01 a R$ 999.999,99, 2 decimais), formato de moeda brasileiro (R$ 1.234,56), prevenção de submissões duplicadas durante processamento
**Scale/Scope**: Sistema bancário frontend, formulários de depósito e saque no dashboard, suporte a transações com validação robusta e feedback visual

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

**Status**: PASS

**Analysis**:

- O projeto é um lw-financial Bun workspaces existente
- Frontend usa React Router 7 (Remix) já configurado
- Backend endpoint `/v1/event` já implementado, mas precisa modificação para identificar conta automaticamente
- Feature adiciona componentes de formulário no frontend seguindo estrutura existente
- Não há violações de princípios constitucionais detectadas
- A feature é focada e bem delimitada (formulários de depósito e saque)
- Uso de ShadcnUI e Tailwind CSS v4 alinhado com guidelines do projeto
- React Query para gerenciamento de estado e cache de dados
- react-hook-form + zod para validação de formulários (padrão do projeto)

### Post-Design Check (After Phase 1)

**Status**: PASS

**Analysis**:

- Estrutura de código mantém organização existente do lw-financial frontend
- Componentes seguem padrão ShadcnUI já estabelecido no projeto
- Hooks customizados para lógica reutilizável (use-deposit, use-withdraw)
- Uso de React Query alinhado com padrões do projeto (já usado em use-balance)
- Validação com react-hook-form + zod seguindo padrão do projeto
- Formatação de moeda usando função existente (format-currency.ts)
- Modificação mínima no backend (apenas handler de eventos)
- Nenhuma complexidade desnecessária adicionada
- Feature bem isolada e testável independentemente
- Contratos API documentados seguindo padrão OpenAPI 3.0
- Backend modification alinha com padrão existente (balance endpoint)

## Project Structure

### Documentation (this feature)

```text
specs/005-deposit-withdraw/
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
│   │   └── dashboard.tsx               # Atualizar: adicionar formulários de depósito e saque
│   ├── components/
│   │   └── dashboard/
│   │       ├── balance-card.tsx        # Já existe
│   │       ├── deposit-form.tsx        # Novo: formulário de depósito
│   │       ├── withdraw-form.tsx       # Novo: formulário de saque
│   │       └── transaction-button.tsx  # Novo: botão reutilizável com loading state
│   ├── hooks/
│   │   ├── use-balance.ts              # Já existe
│   │   ├── use-deposit.ts              # Novo: hook para depósito
│   │   └── use-withdraw.ts             # Novo: hook para saque
│   └── lib/
│       ├── api.ts                      # Atualizar: adicionar funções deposit() e withdraw()
│       └── format-currency.ts          # Já existe
│
apps/backend/
├── src/
│   ├── bank/
│   │   ├── handlers/
│   │   │   └── event.ts                # Modificar: identificar conta automaticamente via JWT
│   │   └── services/
│   │       └── account.service.ts      # Já existe (pode precisar ajustes)
│   └── types/
│       └── auth.ts                     # Já existe
```

**Structure Decision**: Web application com frontend React Router 7 e backend Fastify. A feature adiciona componentes de formulário no frontend e modifica o handler de eventos no backend para suportar identificação automática de conta via JWT token.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_No violations detected._
