# TODO - Lista de Tarefas do Projeto

**Última Atualização**: 2025-12-03

---

## 🎯 Status Geral

- **Features Concluídas**: 5/6 (83.3%)
- **Features Em Progresso**: 1/6 (16.7%)
- **User Stories Concluídas**: 21/22 (95.5%)
- **Tasks Pendentes**: ~10 tasks

---

## 🔴 Prioridade Alta

### Feature 004-auth-dashboard - Testes Pendentes

- [ ] **T020** [US1] Adicionar testes unitários para componente LoginForm
  - Arquivo: `apps/frontend/tests/unit/login-form.test.tsx`
  - Dependências: Nenhuma
  - Estimativa: 2-3 horas

- [ ] **T021** [US1] Adicionar testes de integração para fluxo completo de login
  - Arquivo: `apps/frontend/tests/integration/login-flow.test.ts`
  - Dependências: T020 (recomendado)
  - Estimativa: 3-4 horas

- [ ] **T022** [US1] Verificar que login completo ocorre em <5 segundos (SC-001) e 100% dos logins bem-sucedidos armazenam token e redirecionam (SC-002)
  - Arquivo: `apps/frontend/tests/integration/login-flow.test.ts`
  - Dependências: T021
  - Estimativa: 1-2 horas

- [ ] **T038** [US2] Adicionar testes unitários para componente BalanceCard
  - Arquivo: `apps/frontend/tests/unit/balance-card.test.tsx`
  - Dependências: Nenhuma
  - Estimativa: 2-3 horas

- [ ] **T039** [US2] Adicionar testes de integração para fluxo completo do dashboard
  - Arquivo: `apps/frontend/tests/integration/dashboard-flow.test.ts`
  - Dependências: T038 (recomendado)
  - Estimativa: 3-4 horas

- [ ] **T040** [US2] Verificar que saldo é exibido em <2 segundos após carregamento (SC-003) e atualizado em <3 segundos após operações (SC-005)
  - Arquivo: `apps/frontend/tests/integration/dashboard-flow.test.ts`
  - Dependências: T039
  - Estimativa: 1-2 horas

**Total Estimado**: 12-18 horas

---

## 🟡 Prioridade Média

### Feature Nova - US-019: Dashboard - Realizar Transferência

- [ ] **Criar especificação** para feature de transferência no dashboard
  - Arquivo: `specs/007-transfer-dashboard/spec.md`
  - Dependências: Nenhuma
  - Estimativa: 2-3 horas

- [ ] **Criar plano de implementação**
  - Arquivo: `specs/007-transfer-dashboard/plan.md`
  - Dependências: spec.md
  - Estimativa: 1-2 horas

- [ ] **Criar tasks de implementação**
  - Arquivo: `specs/007-transfer-dashboard/tasks.md`
  - Dependências: plan.md
  - Estimativa: 1-2 horas

- [ ] **Implementar componente TransferForm**
  - Arquivo: `apps/frontend/app/components/dashboard/transfer-form.tsx`
  - Dependências: Backend já implementado (US-012)
  - Estimativa: 4-6 horas

- [ ] **Criar hook use-transfer**
  - Arquivo: `apps/frontend/app/hooks/use-transfer.ts`
  - Dependências: API function
  - Estimativa: 2-3 horas

- [ ] **Adicionar função transfer() na API**
  - Arquivo: `apps/frontend/app/lib/api.ts`
  - Dependências: Nenhuma
  - Estimativa: 1-2 horas

- [ ] **Integrar TransferForm no dashboard**
  - Arquivo: `apps/frontend/app/routes/dashboard.tsx`
  - Dependências: TransferForm completo
  - Estimativa: 1 hora

- [ ] **Adicionar testes unitários**
  - Arquivo: `apps/frontend/tests/unit/transfer-form.test.tsx`
  - Dependências: TransferForm completo
  - Estimativa: 2-3 horas

- [ ] **Adicionar testes de integração**
  - Arquivo: `apps/frontend/tests/integration/transfer-flow.test.ts`
  - Dependências: TransferForm completo
  - Estimativa: 2-3 horas

**Total Estimado**: 16-24 horas

---

## 🟢 Prioridade Baixa

### Melhorias e Otimizações

- [ ] **Revisar performance de queries do banco de dados**
  - Foco: Queries de transações e saldo
  - Estimativa: 4-6 horas

- [ ] **Adicionar mais componentes Shadcn UI conforme necessário**
  - Componentes adicionais que possam melhorar UX
  - Estimativa: Variável

- [ ] **Melhorar documentação de API**
  - Atualizar Swagger/OpenAPI
  - Adicionar exemplos
  - Estimativa: 3-4 horas

- [ ] **Adicionar mais testes de integração end-to-end**
  - Fluxos completos de usuário
  - Estimativa: 6-8 horas

- [ ] **Otimizar bundle size do frontend**
  - Code splitting
  - Lazy loading
  - Estimativa: 4-6 horas

---

## ✅ Tarefas Concluídas Recentemente

### 2025-12-03

- ✅ Implementado componente Empty do Shadcn UI no histórico de transações
- ✅ Adicionado saldo inicial no histórico de transações (quando > 0)
- ✅ Criados testes unitários para TransactionHistory (27 testes)
- ✅ Revisão de código completa do TransactionHistory
- ✅ Adicionado lucide-react ao frontend

### 2025-12-02

- ✅ Feature 006-logout-transactions concluída (18/18 tasks)
- ✅ Feature 005-deposit-withdraw concluída (45/45 tasks)
- ✅ Feature 004-auth-dashboard quase concluída (47/50 tasks)

---

## 📋 Checklist de Qualidade

### Antes de Marcar Feature como Concluída

- [ ] Todas as tasks da feature estão concluídas
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Lint e format executados
- [ ] Type-check passando
- [ ] Documentação atualizada
- [ ] Code review realizado
- [ ] Critérios de sucesso validados

---

## 📊 Métricas de Progresso

### Por Feature

| Feature                 | Progresso | Tasks Concluídas | Tasks Pendentes |
| ----------------------- | --------- | ---------------- | --------------- |
| 001-login-fastify-auth  | 100%      | 35/35            | 0               |
| 002-protected-routes    | 100%      | 59/59            | 0               |
| 003-bank-account-model  | 100%      | 39/39            | 0               |
| 004-auth-dashboard      | 94%       | 47/50            | 3               |
| 005-deposit-withdraw    | 100%      | 45/45            | 0               |
| 006-logout-transactions | 100%      | 18/18            | 0               |

### Por User Story

| Fase                          | User Stories Concluídas | Total | Progresso |
| ----------------------------- | ----------------------- | ----- | --------- |
| Fase 1 - Fundação             | 3/3                     | 3     | 100%      |
| Fase 2 - Operações Bancárias  | 11/11                   | 11    | 100%      |
| Fase 3 - Interface de Usuário | 7/8                     | 8     | 87.5%     |

---

## 🔗 Links Úteis

- [Relatório de Progresso Detalhado](./docs/progress/PROGRESS_REPORT.md)
- [Documentação do Projeto](./docs/README.md)
- [Especificações Técnicas](./specs/)

---

**Nota**: Este arquivo é atualizado regularmente. Para informações mais detalhadas, consulte o [Relatório de Progresso](./docs/progress/PROGRESS_REPORT.md).
