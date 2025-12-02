# Implementation Plan: Protected Routes Authentication

**Branch**: `002-protected-routes` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-protected-routes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar middleware de autenticação para proteger rotas da API usando validação de tokens JWT. O sistema deve validar tokens no header `Authorization: Bearer <token>`, verificar assinatura e expiração, e retornar 401 Unauthorized para requisições não autenticadas ou com tokens inválidos. A validação deve ser stateless (sem consulta ao banco de dados) e completar em menos de 50ms.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js (via Bun runtime)
**Primary Dependencies**: Fastify, jsonwebtoken, Better Auth (para integração futura)
**Storage**: N/A (validação stateless, sem consulta ao banco de dados)
**Testing**: Bun test (ou Jest/Vitest se necessário)
**Target Platform**: Linux server (Node.js/Bun runtime)
**Project Type**: Web application (lw-financial backend)
**Performance Goals**: Validação de autenticação completa em <50ms (SC-002)
**Constraints**: Validação stateless (sem consulta ao banco), integração com sistema de login existente (US-001), middleware reutilizável para múltiplas rotas
**Scale/Scope**: Sistema bancário, proteção de rotas críticas, middleware aplicável a qualquer rota futura

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

**Status**: PASS

**Analysis**:

- O projeto é um lw-financial Bun workspaces existente
- Backend já usa Fastify (migrado na US-001)
- Sistema de login (US-001) já implementado e gera tokens JWT
- Middleware de autenticação é uma extensão natural do sistema existente
- Não há violações de princípios constitucionais detectadas
- A feature é focada e bem delimitada (apenas middleware de proteção de rotas)
- Validação stateless mantém performance e simplicidade

### Post-Design Check (After Phase 1)

**Status**: PASS

**Analysis**:

- Estrutura de código mantém organização existente do lw-financial
- Middleware de autenticação segue padrão similar ao middleware de validação existente
- Validação stateless mantém performance (<50ms) e simplicidade
- Integração com sistema de login existente (US-001) usando mesmo secret
- Testes planejados (unit e integration)
- Nenhuma complexidade desnecessária adicionada
- Feature bem isolada e testável independentemente
- Middleware reutilizável para múltiplas rotas futuras

## Project Structure

### Documentation (this feature)

```text
specs/002-protected-routes/
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
│   ├── middleware/
│   │   ├── validation.ts           # Middleware de validação de login (existente)
│   │   └── authentication.ts        # Novo: Middleware de autenticação JWT
│   ├── auth/
│   │   ├── better-auth.ts          # Configuração do Better Auth (existente)
│   │   └── routes.ts                # Rotas de autenticação (existente)
│   └── types/
│       └── auth.ts                  # Tipos TypeScript para autenticação (existente, pode ser estendido)
└── tests/
    ├── integration/
    │   └── protected-routes.test.ts # Testes de integração do middleware
    └── unit/
        └── authentication.test.ts   # Testes unitários do middleware de autenticação

packages/shared/
└── src/
    └── schemas/
        └── auth.ts                 # Schemas Zod (existente, pode ser estendido se necessário)
```

**Structure Decision**: LW Financial Bun workspaces existente. Backend em `apps/backend/` com estrutura modular. Middleware de autenticação será criado em `apps/backend/src/middleware/authentication.ts` seguindo padrão similar ao middleware de validação existente. Testes em `apps/backend/tests/` seguindo estrutura existente.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
