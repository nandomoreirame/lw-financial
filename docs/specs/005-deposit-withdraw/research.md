# Research: Dashboard Deposit and Withdraw Operations

**Feature**: 005-deposit-withdraw
**Date**: 2025-12-02
**Status**: Complete

## Research Tasks

### 1. Backend Event Handler Modification

**Task**: Modificar backend para identificar conta automaticamente via JWT token

**Decision**: Modificar o handler `/v1/event` para extrair `userId` do token JWT e usar `getOrCreateDefaultAccount(userId)` para obter a conta padrão do usuário, eliminando a necessidade de enviar `destination`/`origin` do frontend.

**Rationale**:

- Alinha com o padrão já usado no endpoint `/balance`
- Melhora segurança (não expõe accountId no frontend)
- Simplifica o frontend (menos dados para gerenciar)
- Mantém consistência com a arquitetura existente

**Alternatives considered**:

- Frontend obter accountId via chamada adicional: Rejeitado - adiciona latência e complexidade desnecessária
- Backend aceitar accountId opcional: Rejeitado - mantém ambiguidade e não resolve o problema de segurança

**Implementation Notes**:

- O `accountService` já possui `getOrCreateDefaultAccount(userId)` que pode ser usado
- O handler precisa ser modificado para aceitar requisições sem `destination`/`origin` quando autenticado
- Para depósitos: usar conta padrão como `destination`
- Para saques: usar conta padrão como `origin`

### 2. Form Validation with react-hook-form + zod

**Task**: Implementar validação de formulários com react-hook-form e zod

**Decision**: Usar react-hook-form para gerenciamento de estado de formulário e zod para validação de schema, seguindo padrão do projeto.

**Rationale**:

- Já está no projeto (dependência existente)
- Validação type-safe com TypeScript
- Performance otimizada (validação sob demanda)
- Integração nativa com ShadcnUI components

**Alternatives considered**:

- Validação manual com useState: Rejeitado - mais código, menos type-safety
- Apenas validação no backend: Rejeitado - pior UX (feedback tardio)

**Schema Requirements**:

- Valor mínimo: 0.01
- Valor máximo: 999999.99
- Precisão: exatamente 2 casas decimais
- Formato: número positivo

### 3. Currency Input Component

**Task**: Criar componente de input para valores monetários

**Decision**: Usar Input do ShadcnUI com máscara/formatação customizada para aceitar apenas valores válidos (R$ 0,01 a R$ 999.999,99, 2 decimais).

**Rationale**:

- Reutiliza componente existente (ShadcnUI Input)
- Mantém consistência visual
- Validação em tempo real melhora UX
- Formatação automática guia o usuário

**Alternatives considered**:

- Input numérico simples: Rejeitado - não formata automaticamente, pior UX
- Biblioteca de máscara monetária: Rejeitado - adiciona dependência desnecessária

**Implementation Notes**:

- Usar `onChange` para formatar valor enquanto digita
- Validar formato antes de submit
- Mostrar placeholder: "R$ 0,00"
- Aceitar apenas números e vírgula/ponto para decimais

### 4. Loading State with ShadcnUI Button

**Task**: Implementar estado de loading no botão de submit

**Decision**: Usar propriedade `disabled` e `children` condicionais do Button do ShadcnUI para mostrar spinner e texto "Processando..." durante requisição.

**Rationale**:

- Button do ShadcnUI já suporta estados de loading
- Mantém consistência com design system
- Feedback visual claro para o usuário
- Previne submissões duplicadas automaticamente

**Alternatives considered**:

- Overlay de loading: Rejeitado - bloqueia toda a interface, pior UX
- Apenas desabilitar botão: Rejeitado - não fornece feedback suficiente

**Implementation Notes**:

- Usar `isLoading` state do React Query mutation
- Mostrar spinner (pode usar Loader2 do lucide-react)
- Texto: "Processando..."
- Desabilitar botão durante loading

### 5. React Query Mutations for Transactions

**Task**: Usar React Query mutations para depósitos e saques

**Decision**: Criar mutations customizadas com `useMutation` do React Query para gerenciar requisições de depósito e saque, com invalidação automática da query de saldo após sucesso.

**Rationale**:

- Já está no projeto (@tanstack/react-query)
- Cache automático e invalidação inteligente
- Estados de loading/error gerenciados automaticamente
- Retry e error handling built-in

**Alternatives considered**:

- useState + fetch manual: Rejeitado - mais código, menos funcionalidades
- Redux para estado: Rejeitado - overkill para este caso

**Implementation Notes**:

- Criar hooks `useDeposit()` e `useWithdraw()`
- Invalidar query `useBalance()` após mutation bem-sucedida
- Tratar erros 400, 401, 403, 404, 500
- Mostrar mensagens de erro apropriadas

### 6. Success/Error Messages Display

**Task**: Exibir mensagens de sucesso e erro para transações

**Decision**: Usar componente de Toast/Alert do ShadcnUI para mostrar mensagens temporárias de sucesso e erro após transações.

**Rationale**:

- ShadcnUI já possui componentes de toast/alert
- Não bloqueia a interface
- Auto-dismiss após alguns segundos
- Acessível e bem estilizado

**Alternatives considered**:

- Modal de sucesso/erro: Rejeitado - bloqueia interface, pior UX
- Mensagem inline no formulário: Rejeitado - ocupa espaço permanente

**Implementation Notes**:

- Sucesso: "Depósito realizado com sucesso!" / "Saque realizado com sucesso!"
- Erro: Mensagem específica baseada no código de erro da API
- Duração: 3-5 segundos
- Posição: top-right ou bottom-right

## Summary

Todas as decisões técnicas foram baseadas em:

1. Reutilização de tecnologias já presentes no projeto
2. Consistência com padrões existentes (balance endpoint, autenticação)
3. Melhor experiência do usuário (feedback visual, validação em tempo real)
4. Segurança (identificação automática de conta via JWT)
5. Manutenibilidade (código limpo, type-safe, testável)

Nenhuma dependência nova é necessária - todas as tecnologias já estão no projeto.
