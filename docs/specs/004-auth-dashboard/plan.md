# Implementation Plan: Interface de Autenticação e Dashboard de Saldo

**Branch**: `004-auth-dashboard` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-auth-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar interface de autenticação (tela de login) e dashboard de visualização de saldo no frontend usando React Router 7 (Remix). A feature inclui: (1) Tela de login com campos username/password que autentica via POST `/login` e armazena JWT em sessionStorage + httpOnly cookie via server-side; (2) Dashboard protegido que exibe saldo do usuário autenticado via GET `/balance`, com skeleton loader durante carregamento, atualização automática após operações bancárias e botão de refresh manual. O saldo é formatado como Real brasileiro (R$ 1.234,56). O sistema detecta token JWT expirado e redireciona automaticamente para login com mensagem informativa.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js (via Bun runtime)
**Primary Dependencies**: React Router 7 (Remix), React 19.1.1, Tailwind CSS v4.1.13, ShadcnUI, @tanstack/react-query, react-hook-form, zod
**Storage**: sessionStorage (client-side) + httpOnly cookie (server-side via React Router 7 / Remix) para JWT token
**Testing**: Bun test (ou Jest/Vitest) - testes de integração e unitários para componentes e fluxos de autenticação
**Target Platform**: Web browser (React Router 7 SSR/SPA)
**Project Type**: Web application (lw-financial frontend)
**Performance Goals**: Login completo em <5 segundos (SC-001), saldo exibido em <2 segundos após carregamento do dashboard (SC-003), atualização de saldo em <3 segundos após operações (SC-005)
**Constraints**: Integração com backend Fastify existente (`/login` e `/balance`), uso de React Router 7 para roteamento e gerenciamento de cookies server-side, formato de moeda brasileiro (R$ 1.234,56)
**Scale/Scope**: Sistema bancário frontend, interface de autenticação e dashboard de saldo, suporte a sessões de usuário com token JWT

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

**Status**: PASS

**Analysis**:

- O projeto é um lw-financial Bun workspaces existente
- Frontend usa React Router 7 (Remix) já configurado
- Backend endpoints `/login` e `/balance` já implementados e funcionais
- Feature adiciona rotas e componentes no frontend seguindo estrutura existente
- Não há violações de princípios constitucionais detectadas
- A feature é focada e bem delimitada (interface de autenticação e dashboard de saldo)
- Uso de ShadcnUI e Tailwind CSS v4 alinhado com guidelines do projeto
- React Query para gerenciamento de estado e cache de dados

### Post-Design Check (After Phase 1)

**Status**: PASS

**Analysis**:

- Estrutura de código mantém organização existente do lw-financial frontend
- Rotas seguem convenção do React Router 7 (app/routes/)
- Componentes organizados por feature (login, dashboard) seguindo padrão do projeto
- Hooks customizados para lógica reutilizável (use-auth, use-balance)
- Uso de React Query alinhado com padrões do projeto
- Formatação de moeda usando API nativa (Intl.NumberFormat) sem dependências extras
- Token storage híbrido (sessionStorage + httpOnly cookie) seguindo especificação
- Nenhuma complexidade desnecessária adicionada
- Feature bem isolada e testável independentemente
- Contratos API documentados seguindo padrão OpenAPI 3.0

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   │   ├── login.tsx                    # Rota de login (/login)
│   │   ├── dashboard.tsx               # Rota protegida do dashboard (/dashboard)
│   │   └── routes.ts                   # Configuração de rotas (atualizar)
│   ├── components/
│   │   ├── login/
│   │   │   ├── login-form.tsx          # Formulário de login
│   │   │   └── login-error.tsx         # Componente de erro de login
│   │   └── dashboard/
│   │       ├── balance-card.tsx        # Card de exibição de saldo
│   │       ├── balance-skeleton.tsx    # Skeleton loader para saldo
│   │       └── refresh-button.tsx      # Botão de refresh manual
│   ├── hooks/
│   │   ├── use-auth.ts                 # Hook para autenticação
│   │   └── use-balance.ts              # Hook para buscar saldo
│   ├── lib/
│   │   ├── auth.ts                     # Utilitários de autenticação (token storage, validação)
│   │   └── api.ts                      # Cliente API (fetch para /login e /balance)
│   └── middleware/
│       └── protected-route.ts         # Middleware para rotas protegidas (React Router 7)
└── tests/
    ├── integration/
    │   ├── login-flow.test.ts          # Teste de fluxo completo de login
    │   └── dashboard-flow.test.ts      # Teste de fluxo do dashboard
    └── unit/
        ├── login-form.test.tsx         # Teste do componente de login
        └── balance-card.test.tsx       # Teste do componente de saldo
```

**Structure Decision**: LW Financial Bun workspaces existente. Frontend em `apps/frontend/` usando React Router 7 (Remix). Rotas criadas em `app/routes/` seguindo convenção do React Router 7. Componentes organizados por feature (login, dashboard) em `app/components/`. Hooks customizados em `app/hooks/` para lógica reutilizável. Utilitários de autenticação e API em `app/lib/`. Middleware de proteção de rotas em `app/middleware/`. Testes de integração e unitários seguindo estrutura existente.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - Nenhuma violação detectada. Feature adiciona componentes e rotas seguindo padrões estabelecidos do projeto, sem introduzir complexidade desnecessária.
