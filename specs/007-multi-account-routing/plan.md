# Implementation Plan: Multi-Account Management with Account Code Routing

**Branch**: `007-multi-account-routing` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-multi-account-routing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar sistema de múltiplas contas bancárias por usuário com códigos de conta únicos, roteamento via URL e seleção de conta na sidebar. A feature inclui: (1) Geração automática de códigos de conta no formato "XXXX-X" (4 dígitos, hífen, 1 dígito) durante criação de contas; (2) Roteamento customizado `/conta/[AccountCode]` para acesso direto a contas específicas; (3) Dropdown na sidebar para seleção de contas; (4) Filtragem de histórico de transações por conta selecionada; (5) Depósitos e saques aplicados à conta atualmente selecionada. Modificações no backend: adicionar campo `code` único ao modelo BankAccount, implementar geração de código único, criar endpoints para listar contas do usuário e buscar conta por código. Modificações no frontend: criar rota dinâmica `/conta/:accountCode`, atualizar sidebar para exibir dropdown de contas, filtrar transações por conta, e passar código de conta em requisições de depósito/saque.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js (via Bun runtime)
**Primary Dependencies**: React Router 7 (Remix), React 19.1.1, Tailwind CSS v4.1.13, ShadcnUI, @tanstack/react-query, react-hook-form, zod, Fastify, Prisma ORM 5.7.1
**Storage**: PostgreSQL (via Prisma) para persistência de contas bancárias com códigos únicos, sessionStorage para token JWT no frontend
**Testing**: Bun test - testes de integração e unitários para geração de códigos, roteamento, seleção de contas e filtragem de transações
**Target Platform**: Web browser (React Router 7 SSR/SPA)
**Project Type**: Web application (lw-financial frontend + backend modifications)
**Performance Goals**: Navegação para conta via URL em <2 segundos (SC-004), seleção de conta na sidebar atualiza em <1 segundo (SC-005), histórico de transações atualiza em <1 segundo após nova transação (SC-010)
**Constraints**: Integração com backend Fastify existente, modificação do schema Prisma para adicionar campo `code` único, geração de código único mesmo em alta concorrência, formato de código fixo "XXXX-X", códigos imutáveis após criação, validação de propriedade de conta em todas as rotas
**Scale/Scope**: Sistema bancário frontend e backend, suporte a múltiplas contas por usuário, roteamento dinâmico, seleção de conta na sidebar, filtragem de transações por conta

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

**Status**: PASS

**Analysis**:

- O projeto é um lw-financial Bun workspaces existente
- Frontend usa React Router 7 (Remix) já configurado com suporte a rotas dinâmicas
- Backend usa Prisma ORM e PostgreSQL, schema pode ser modificado para adicionar campo `code`
- Feature adiciona funcionalidade de múltiplas contas mantendo compatibilidade com sistema existente
- Modelo BankAccount já existe e suporta relação 1:N com User
- Geração de código único pode usar constraints de unicidade no banco de dados
- Roteamento dinâmico é suportado pelo React Router 7
- Não há violações de princípios constitucionais detectadas
- A feature é focada e bem delimitada (múltiplas contas, códigos, roteamento)
- Uso de ShadcnUI e Tailwind CSS v4 alinhado com guidelines do projeto
- React Query para gerenciamento de estado e cache de lista de contas

### Post-Design Check (After Phase 1)

**Status**: PASS

**Analysis**:

- Estrutura de código mantém organização existente do lw-financial
- Componentes seguem padrão ShadcnUI já estabelecido no projeto
- Hooks customizados seguindo padrão use-balance, use-accounts
- Uso de React Query alinhado com padrões do projeto
- Roteamento dinâmico usando recursos nativos do React Router 7
- Migração de schema Prisma seguindo padrão existente
- Geração de código único usando algoritmo determinístico com retry em caso de conflito
- Validação de propriedade de conta em todas as rotas protegidas
- Nenhuma complexidade desnecessária adicionada
- Feature bem isolada e testável independentemente
- Contratos API documentados seguindo padrão OpenAPI 3.0
- Backend endpoints alinham com padrão existente

## Project Structure

### Documentation (this feature)

```text
specs/007-multi-account-routing/
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
│   └── schema.prisma                    # Atualizar: adicionar campo code ao BankAccount
├── src/
│   ├── bank/
│   │   ├── services/
│   │   │   ├── account.service.ts       # Atualizar: adicionar geração de código, buscar por código
│   │   │   └── account-code.service.ts  # Novo: serviço para geração de códigos únicos
│   │   ├── handlers/
│   │   │   ├── accounts.ts              # Já existe: atualizar para retornar códigos
│   │   │   └── account-by-code.ts       # Novo: handler para buscar conta por código
│   │   └── routes.ts                    # Atualizar: adicionar rota GET /accounts/:code
│   └── db/
│       └── client.ts                    # Já existe

apps/frontend/
├── app/
│   ├── routes/
│   │   ├── dashboard.tsx                # Atualizar: redirecionar para /conta/:accountCode
│   │   └── conta.$accountCode.tsx       # Novo: rota dinâmica para conta específica
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── dashboard-sidebar.tsx    # Atualizar: adicionar dropdown de contas, sincronizar com URL
│   │   └── balance-card.tsx             # Atualizar: receber accountCode como prop
│   ├── hooks/
│   │   ├── use-accounts.ts              # Atualizar: adicionar busca por código
│   │   ├── use-balance.ts               # Atualizar: aceitar accountCode como parâmetro
│   │   ├── use-deposit.ts               # Atualizar: incluir accountCode na requisição
│   │   ├── use-withdraw.ts              # Atualizar: incluir accountCode na requisição
│   │   └── use-transactions.ts          # Atualizar: filtrar por accountCode
│   └── lib/
│       └── api.ts                       # Atualizar: adicionar função getAccountByCode(), atualizar funções para incluir accountCode
```

## Phase 0: Outline & Research

### Research Tasks

1. **Geração de Código Único para Contas Bancárias**
   - Algoritmo para gerar códigos no formato "XXXX-X"
   - Garantia de unicidade em alta concorrência
   - Estratégia de retry em caso de conflito

2. **React Router 7 Rotas Dinâmicas**
   - Padrão para rotas dinâmicas `/conta/:accountCode`
   - Validação de parâmetros de rota
   - Redirecionamento e navegação programática

3. **Filtragem de Transações por Conta**
   - Extensão do endpoint de transações para filtrar por accountCode
   - Performance de queries com filtro por conta

4. **Seleção de Conta na Sidebar**
   - Sincronização entre URL e estado do dropdown
   - Atualização de múltiplos componentes ao trocar de conta

**Output**: `research.md` with all research findings and decisions

## Phase 1: Design & Contracts

### Data Model Changes

**BankAccount Entity Updates**:

- Add `code` field (String, unique, format "XXXX-X")
- Add unique constraint on `code` field
- Ensure code generation on account creation

**Transaction Filtering**:

- Filter transactions by `originAccountId` or `destinationAccountId`
- Support filtering by account code via account lookup

**Output**: `data-model.md` with updated entity definitions

### API Contracts

**New Endpoints**:

- `GET /v1/accounts/:code` - Buscar conta por código (autenticado)
- `GET /v1/accounts` - Listar todas as contas do usuário (já existe, atualizar para incluir códigos)

**Modified Endpoints**:

- `POST /v1/event` - Aceitar `accountCode` opcional para depósito/saque
- `GET /v1/transactions` - Aceitar `accountCode` como query parameter para filtrar

**Output**: `contracts/` directory with OpenAPI 3.0 specifications

### Quickstart Guide

Guide for developers to quickly understand and set up the multi-account routing feature.

**Output**: `quickstart.md` with step-by-step setup instructions

## Phase 2: Implementation Planning

_This phase is handled by `/speckit.tasks` command, not `/speckit.plan`_

The tasks.md file will be generated separately and will include:

- Database migration for adding `code` field
- Backend code generation service
- Backend handlers and routes
- Frontend route configuration
- Frontend components and hooks
- Integration and testing tasks
