# Implementation Tasks: Interface de Autenticação e Dashboard de Saldo

**Feature**: 004-auth-dashboard
**Branch**: `004-auth-dashboard`
**Date**: 2025-12-02
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Summary

Este documento lista todas as tarefas de implementação para a feature **Interface de Autenticação e Dashboard de Saldo**, organizadas por fase e user story. Cada tarefa é independente e pode ser executada seguindo a especificação e o plano de implementação.

**Total Tasks**: 35
**User Story 1 (Login)**: 15 tasks
**User Story 2 (Dashboard)**: 15 tasks
**Setup & Foundational**: 5 tasks

## Dependencies

### User Story Completion Order

```
Phase 1: Setup
    ↓
Phase 2: Foundational (utilitários compartilhados)
    ↓
Phase 3: User Story 1 - Autenticação (P1) ← MVP SCOPE
    ↓
Phase 4: User Story 2 - Dashboard (P1)
    ↓
Phase 5: Polish & Cross-cutting
```

**Note**: User Story 1 (Login) é o MVP mínimo. User Story 2 (Dashboard) depende de User Story 1 estar completa.

## Parallel Execution Opportunities

### Phase 2 (Foundational)

- T001, T002, T003 podem ser executados em paralelo (arquivos diferentes, sem dependências)

### Phase 3 (User Story 1)

- T006, T007 podem ser executados em paralelo (hooks e lib separados)
- T008, T009 podem ser executados em paralelo (componentes diferentes)
- T010, T011 podem ser executados em paralelo (rota e atualização de config)

### Phase 4 (User Story 2)

- T017, T018 podem ser executados em paralelo (hooks e lib separados)
- T019, T020, T021 podem ser executados em paralelo (componentes diferentes)
- T022, T023 podem ser executados em paralelo (rota e atualização de config)

## Implementation Strategy

**MVP First**: Implementar apenas Phase 1, 2 e 3 (User Story 1 - Login) para entregar valor mínimo funcional.

**Incremental Delivery**:

1. MVP: Login funcional com redirecionamento
2. Increment 1: Dashboard com visualização de saldo
3. Increment 2: Tratamento de erros e edge cases
4. Increment 3: Testes e polish

---

## Phase 1: Setup

**Goal**: Preparar estrutura de diretórios e configurações básicas

**Independent Test**: Estrutura de diretórios criada, arquivos de configuração atualizados

### Tasks

- [x] T001 Criar estrutura de diretórios para componentes de login em apps/frontend/app/components/login/
- [x] T002 Criar estrutura de diretórios para componentes de dashboard em apps/frontend/app/components/dashboard/
- [x] T003 Criar estrutura de diretórios para hooks em apps/frontend/app/hooks/
- [x] T004 Criar estrutura de diretórios para middleware em apps/frontend/app/middleware/

---

## Phase 2: Foundational

**Goal**: Implementar utilitários compartilhados e middleware que serão usados por todas as user stories

**Independent Test**: Utilitários podem ser importados e usados, middleware funciona corretamente

### Tasks

- [x] T005 [P] Implementar utilitários de autenticação (token storage, validação, decodificação) em apps/frontend/app/lib/auth.ts
- [x] T006 [P] Implementar cliente API (funções para POST /login e GET /balance) em apps/frontend/app/lib/api.ts
- [x] T007 [P] Implementar middleware de proteção de rotas (validação de JWT, redirecionamento) em apps/frontend/app/middleware/protected-route.ts

---

## Phase 3: User Story 1 - Autenticação via Tela de Login (P1)

**Goal**: Como usuário do sistema, eu quero ter uma tela de login com campos para username e password para que eu possa autenticar no sistema e acessar minhas funcionalidades bancárias.

**Independent Test**: Pode ser totalmente testado fornecendo credenciais válidas através da interface, verificando que o sistema autentica o usuário, armazena o token de autenticação e redireciona para o dashboard. Entrega valor imediato ao permitir que usuários acessem o sistema de forma segura.

**Acceptance Criteria**:

1. ✅ Usuário preenche username e password corretamente → sistema autentica, armazena token JWT e redireciona para dashboard
2. ✅ Sistema faz POST /login e recebe token JWT
3. ✅ Token armazenado pode ser usado para autenticar requisições subsequentes

### Tasks

- [x] T008 [P] [US1] Implementar hook useAuth para gerenciar estado de autenticação em apps/frontend/app/hooks/use-auth.ts
- [x] T009 [P] [US1] Criar componente LoginForm com campos username e password em apps/frontend/app/components/login/login-form.tsx
- [x] T010 [P] [US1] Criar componente LoginError para exibir mensagens de erro de autenticação em apps/frontend/app/components/login/login-error.tsx
- [x] T011 [US1] Implementar rota de login (/login) em apps/frontend/app/routes/login.tsx
- [x] T012 [US1] Atualizar configuração de rotas para incluir rota /login em apps/frontend/app/routes.ts
- [x] T013 [US1] Integrar validação de formulário usando react-hook-form + zod em apps/frontend/app/components/login/login-form.tsx
- [x] T014 [US1] Implementar armazenamento de token em sessionStorage após login bem-sucedido em apps/frontend/app/hooks/use-auth.ts
- [x] T015 [US1] Implementar armazenamento de token em httpOnly cookie via React Router 7 server-side em apps/frontend/app/routes/login.tsx
- [x] T016 [US1] Implementar redirecionamento para /dashboard após login bem-sucedido em apps/frontend/app/routes/login.tsx
- [x] T017 [US1] Implementar tratamento de erros de autenticação (credenciais inválidas) em apps/frontend/app/components/login/login-form.tsx
- [x] T018 [US1] Implementar validação de campos obrigatórios antes de enviar requisição em apps/frontend/app/components/login/login-form.tsx
- [x] T019 [US1] Implementar redirecionamento para dashboard se usuário já estiver autenticado ao acessar /login em apps/frontend/app/routes/login.tsx
- [ ] T020 [US1] Adicionar testes unitários para componente LoginForm em apps/frontend/tests/unit/login-form.test.tsx
- [ ] T021 [US1] Adicionar testes de integração para fluxo completo de login em apps/frontend/tests/integration/login-flow.test.ts
- [ ] T022 [US1] Verificar que login completo ocorre em <5 segundos (SC-001) e 100% dos logins bem-sucedidos armazenam token e redirecionam (SC-002)

---

## Phase 4: User Story 2 - Visualização de Saldo no Dashboard (P1)

**Goal**: Como usuário autenticado, eu quero visualizar o saldo da minha conta no dashboard para que eu possa acompanhar meu saldo atual e ter informações financeiras em tempo real.

**Independent Test**: Pode ser totalmente testado após autenticação bem-sucedida, verificando que o dashboard exibe o saldo da conta do usuário autenticado e que o saldo é obtido através de uma requisição GET para /balance usando o account_id do usuário. Entrega valor imediato ao fornecer informações financeiras essenciais.

**Acceptance Criteria**:

1. ✅ Usuário autenticado carrega dashboard → sistema exibe saldo atual da conta
2. ✅ Sistema faz GET /balance incluindo account_id do usuário autenticado
3. ✅ Saldo é atualizado automaticamente após operações bancárias bem-sucedidas

### Tasks

- [x] T023 [P] [US2] Implementar hook useBalance para buscar e gerenciar saldo usando React Query em apps/frontend/app/hooks/use-balance.ts
- [x] T024 [P] [US2] Implementar função de formatação de moeda brasileira (R$ X.XXX,XX) usando Intl.NumberFormat em apps/frontend/app/lib/format-currency.ts
- [x] T025 [P] [US2] Criar componente BalanceCard para exibir saldo formatado em apps/frontend/app/components/dashboard/balance-card.tsx
- [x] T026 [P] [US2] Criar componente BalanceSkeleton para exibir skeleton loader durante carregamento em apps/frontend/app/components/dashboard/balance-skeleton.tsx
- [x] T027 [P] [US2] Criar componente RefreshButton para atualização manual de saldo em apps/frontend/app/components/dashboard/refresh-button.tsx
- [x] T028 [US2] Implementar rota protegida de dashboard (/dashboard) com loader que valida autenticação em apps/frontend/app/routes/dashboard.tsx
- [x] T029 [US2] Implementar extração de accountId do token JWT no loader do dashboard em apps/frontend/app/routes/dashboard.tsx
- [x] T030 [US2] Implementar busca de saldo via GET /balance no hook useBalance em apps/frontend/app/hooks/use-balance.ts
- [x] T031 [US2] Integrar componente BalanceCard no dashboard com exibição de skeleton loader durante carregamento em apps/frontend/app/routes/dashboard.tsx
- [x] T032 [US2] Implementar exibição de mensagem informativa quando saldo não disponível em apps/frontend/app/components/dashboard/balance-card.tsx
- [x] T033 [US2] Implementar botão de refresh manual para atualização sob demanda de saldo em apps/frontend/app/components/dashboard/refresh-button.tsx
- [x] T034 [US2] Implementar invalidação automática de cache React Query após operações bancárias em apps/frontend/app/hooks/use-balance.ts
- [x] T035 [US2] Implementar detecção de token JWT expirado e redirecionamento para login com mensagem informativa em apps/frontend/app/middleware/protected-route.ts
- [x] T036 [US2] Implementar tratamento de erros quando requisição de saldo falha (rede, servidor) em apps/frontend/app/components/dashboard/balance-card.tsx
- [x] T037 [US2] Atualizar configuração de rotas para incluir rota /dashboard em apps/frontend/app/routes.ts
- [ ] T038 [US2] Adicionar testes unitários para componente BalanceCard em apps/frontend/tests/unit/balance-card.test.tsx
- [ ] T039 [US2] Adicionar testes de integração para fluxo completo do dashboard em apps/frontend/tests/integration/dashboard-flow.test.ts
- [ ] T040 [US2] Verificar que saldo é exibido em <2 segundos após carregamento (SC-003) e atualizado em <3 segundos após operações (SC-005)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Goal**: Melhorias finais, tratamento de edge cases e validação de critérios de sucesso

**Independent Test**: Todos os edge cases tratados, critérios de sucesso validados

### Tasks

- [x] T041 Implementar tratamento de múltiplas operações simultâneas garantindo consistência do saldo exibido em apps/frontend/app/hooks/use-balance.ts
- [x] T042 Implementar tratamento quando usuário autenticado não possui conta bancária associada em apps/frontend/app/routes/dashboard.tsx
- [x] T043 Validar que 100% das falhas de autenticação exibem mensagens claras sem expor informações sensíveis (SC-006) em apps/frontend/app/components/login/login-error.tsx
- [x] T044 Validar que 100% das tentativas de acesso não autenticado ao dashboard são bloqueadas (SC-007) em apps/frontend/app/middleware/protected-route.ts
- [x] T045 Validar que dashboard lida graciosamente com falhas de recuperação de saldo mantendo usabilidade (SC-008) em apps/frontend/app/components/dashboard/balance-card.tsx
- [x] T046 Adicionar acessibilidade (ARIA labels, keyboard navigation) aos componentes de login em apps/frontend/app/components/login/login-form.tsx
- [x] T047 Adicionar acessibilidade (ARIA labels, keyboard navigation) aos componentes de dashboard em apps/frontend/app/components/dashboard/balance-card.tsx
- [x] T048 Revisar e otimizar performance (lazy loading, code splitting) conforme necessário
- [x] T049 Executar lint e format em todos os arquivos criados
- [x] T050 Executar type-check para validar tipos TypeScript

---

## Task Summary

| Phase                             | Tasks     | Count  |
| --------------------------------- | --------- | ------ |
| Phase 1: Setup                    | T001-T004 | 4      |
| Phase 2: Foundational             | T005-T007 | 3      |
| Phase 3: User Story 1 (Login)     | T008-T022 | 15     |
| Phase 4: User Story 2 (Dashboard) | T023-T040 | 18     |
| Phase 5: Polish                   | T041-T050 | 10     |
| **Total**                         |           | **50** |

## MVP Scope

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (User Story 1 - Login)

**MVP Tasks**: T001-T022 (22 tasks)

O MVP entrega:

- ✅ Estrutura de diretórios
- ✅ Utilitários compartilhados
- ✅ Tela de login funcional
- ✅ Autenticação com armazenamento de token
- ✅ Redirecionamento para dashboard após login

**Next Increment**: Phase 4 (User Story 2 - Dashboard) para visualização de saldo.

---

## Notes

- Todas as tarefas devem seguir o formato de checklist estrito: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- Tarefas marcadas com [P] podem ser executadas em paralelo
- Tarefas marcadas com [US1] ou [US2] pertencem à user story correspondente
- Cada tarefa é específica o suficiente para ser executada por um LLM sem contexto adicional
- Arquivos de teste são opcionais mas recomendados para garantir qualidade
