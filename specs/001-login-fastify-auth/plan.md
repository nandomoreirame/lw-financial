# Implementation Plan: Login no Sistema

**Branch**: `001-login-fastify-auth` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-login-fastify-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar endpoint de autenticação `/login` usando Fastify e Better Auth para permitir que usuários façam login com username e senha, retornando um token JWT. A feature substitui o Express atual por Fastify e integra Better Auth seguindo a documentação oficial de integração com Fastify.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js (via Bun runtime)
**Primary Dependencies**: Fastify, Better Auth, @fastify/cors, zod (para validação)
**Storage**: PostgreSQL (via Prisma) - não requerido para esta feature (credenciais hardcoded)
**Testing**: Bun test (ou Jest/Vitest se necessário)
**Target Platform**: Linux server (Node.js/Bun runtime)
**Project Type**: Web application (lw-financial backend)
**Performance Goals**: Login completo em < 2 segundos (SC-001), suportar requisições concorrentes sem degradação (SC-003)
**Constraints**: Migração de Express para Fastify, integração com Better Auth seguindo padrões da documentação oficial
**Scale/Scope**: Sistema bancário, autenticação crítica, credenciais hardcoded inicialmente (admin/admin123)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

**Status**: PASS

**Analysis**:

- O projeto é um lw-financial Bun workspaces existente
- Backend atual usa Express, migração para Fastify é necessária para esta feature
- Better Auth será integrado seguindo documentação oficial
- Não há violações de princípios constitucionais detectadas
- A feature é focada e bem delimitada (apenas endpoint de login)

### Post-Design Check (After Phase 1)

**Status**: PASS

**Analysis**:

- Estrutura de código mantém organização existente do lw-financial
- Validação compartilhada via `packages/shared` (Zod schemas) - boa prática
- Migração Express → Fastify é incremental e não quebra estrutura existente
- Better Auth integrado seguindo padrões da documentação oficial
- Testes planejados (unit e integration)
- Nenhuma complexidade desnecessária adicionada
- Feature bem isolada e testável independentemente

## Project Structure

### Documentation (this feature)

```text
specs/001-login-fastify-auth/
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
├── src/
│   ├── index.ts                    # Server entry point (migrar de Express para Fastify)
│   ├── auth/
│   │   ├── better-auth.ts          # Configuração do Better Auth
│   │   └── routes.ts               # Rotas de autenticação (integração Fastify)
│   ├── middleware/
│   │   └── validation.ts           # Middleware de validação (username/password format)
│   └── types/
│       └── auth.ts                 # Tipos TypeScript para autenticação
├── prisma/
│   └── schema.prisma               # Schema Prisma (não alterado nesta feature)
└── tests/
    ├── integration/
    │   └── auth.test.ts            # Testes de integração do endpoint /login
    └── unit/
        └── validation.test.ts      # Testes unitários de validação

packages/shared/
└── src/
    └── schemas/
        └── auth.ts                 # Schemas Zod para validação de login (username, password)
```

**Structure Decision**: LW Financial Bun workspaces existente. Backend em `apps/backend/` com estrutura modular. Validação compartilhada via `packages/shared` usando Zod. Migração de Express para Fastify mantendo estrutura existente.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação detectada. A migração de Express para Fastify é necessária para suportar Better Auth conforme especificação.
