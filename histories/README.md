# Histórias de Usuário - Sistema Bancário

Este diretório contém todas as histórias de usuário do sistema bancário, organizadas por fases de implementação.

## Estrutura

As histórias estão organizadas em 3 fases principais:

### 📁 [Fase 1: Fundação e Autenticação](./fase-1-fundacao-autenticacao/)

**Backend - Autenticação e Segurança**

Contém as histórias relacionadas à autenticação e segurança do sistema:

- US-001: Login no Sistema ⭐ **INICIAR AQUI**
- US-002: Proteção de Rotas Autenticadas
- US-003: Validação de Credenciais Inválidas

**Total:** 3 histórias

---

### 📁 [Fase 2: Operações Bancárias](./fase-2-operacoes-bancarias/)

**Backend - Operações Core**

Contém todas as histórias relacionadas às operações bancárias:

- US-004: Reset do Sistema
- US-005: Consultar Saldo de Conta Existente
- US-006: Consultar Saldo de Conta Inexistente
- US-007: Criar Conta com Depósito Inicial
- US-008: Realizar Depósito em Conta Existente
- US-009: Realizar Saque em Conta Existente
- US-010: Tentar Saque de Conta Inexistente
- US-011: Tentar Saque com Saldo Insuficiente
- US-012: Realizar Transferência Entre Contas
- US-013: Tentar Transferência de Conta Inexistente
- US-014: Tentar Transferência com Saldo Insuficiente

**Total:** 11 histórias

---

### 📁 [Fase 3: Interface do Usuário](./fase-3-interface-usuario/)

**Frontend - Telas e Interações**

Contém todas as histórias relacionadas à interface do usuário:

- US-015: Tela de Login
- US-016: Dashboard - Visualização de Saldo
- US-017: Dashboard - Realizar Depósito
- US-018: Dashboard - Realizar Saque
- US-019: Dashboard - Realizar Transferência
- US-020: Dashboard - Histórico de Transações
- US-021: Logout
- US-022: Mensagens de Erro

**Total:** 8 histórias

---

## Ordem de Implementação

### Abordagem Recomendada

1. **Implementar Fase 1 completa** (Autenticação)
   - Base para todas as outras funcionalidades
   - Sem dependências externas

2. **Implementar Fase 2 completa** (Operações Bancárias)
   - Depende da Fase 1 (autenticação)
   - Todas as APIs do backend

3. **Implementar Fase 3 completa** (Interface do Usuário)
   - Depende das Fases 1 e 2
   - Frontend que consome as APIs

### Ordem Detalhada por Sprint

Consulte os arquivos `README.md` em cada diretório de fase para ver a ordem detalhada de implementação dentro de cada fase.

---

## Resumo

- **Total de Histórias:** 22
- **Fase 1:** 3 histórias (Autenticação)
- **Fase 2:** 11 histórias (Operações Bancárias)
- **Fase 3:** 8 histórias (Interface do Usuário)

---

## Notas

- Cada história está em um arquivo individual no formato `US-XXX-titulo.md`
- Cada fase possui um `README.md` com detalhes sobre as histórias e dependências
- A ordem de implementação considera dependências técnicas e funcionais
- Recomenda-se implementar backend completo antes de iniciar o frontend
