# Quick Start: Dashboard Deposit and Withdraw Operations

**Feature**: 005-deposit-withdraw
**Date**: 2025-12-02

## Overview

Este guia fornece instruções rápidas para implementar os formulários de depósito e saque no dashboard.

## Prerequisites

- Backend rodando em `http://localhost:3333`
- Frontend rodando em `http://localhost:5173`
- Usuário autenticado (token JWT válido)
- Saldo exibido no dashboard (US-016 implementado)

## Implementation Steps

### 1. Backend: Modificar Event Handler

**File**: `apps/backend/src/bank/handlers/event.ts`

**Changes**:

- Modificar handler para aceitar requisições sem `destination`/`origin` quando autenticado
- Extrair `userId` do token JWT (via `authenticateRequest` middleware)
- Usar `getOrCreateDefaultAccount(userId)` para obter conta padrão
- Para depósitos: usar conta padrão como `destination`
- Para saques: usar conta padrão como `origin`

**Example**:

```typescript
case 'deposit': {
  const authRequest = request as AuthenticatedRequest;
  const userId = authRequest.user.userId;
  const account = await accountService.getOrCreateDefaultAccount(userId);

  const result = await accountService.deposit(account.id, amount, userId);
  return reply.status(201).send({ destination: result });
}
```

### 2. Frontend: Adicionar Funções API

**File**: `apps/frontend/app/lib/api.ts`

**Add**:

```typescript
export async function deposit(
  amount: number
): Promise<{ destination: { id: string; balance: number } }>;
export async function withdraw(
  amount: number
): Promise<{ origin: { id: string; balance: number } }>;
```

**Implementation**:

- Usar `fetchWithTimeout` existente
- Incluir token JWT do `sessionStorage` no header Authorization
- Enviar `{ type: "deposit", amount }` ou `{ type: "withdraw", amount }`
- Tratar erros 400, 401, 403, 404, 500

### 3. Frontend: Criar Hooks React Query

**Files**:

- `apps/frontend/app/hooks/use-deposit.ts`
- `apps/frontend/app/hooks/use-withdraw.ts`

**Implementation**:

- Usar `useMutation` do React Query
- Invalidar query `useBalance()` após sucesso
- Retornar `{ mutate, isLoading, error }`
- Tratar erros e mostrar mensagens apropriadas

### 4. Frontend: Criar Componentes de Formulário

**Files**:

- `apps/frontend/app/components/dashboard/deposit-form.tsx`
- `apps/frontend/app/components/dashboard/withdraw-form.tsx`

**Features**:

- Input monetário com validação (R$ 0,01 a R$ 999.999,99, 2 decimais)
- Botão com estado de loading (spinner + "Processando...")
- Validação com react-hook-form + zod
- Mensagens de erro inline
- Limpar campo após sucesso

### 5. Frontend: Integrar no Dashboard

**File**: `apps/frontend/app/routes/dashboard.tsx`

**Changes**:

- Importar componentes `DepositForm` e `WithdrawForm`
- Adicionar seções de depósito e saque abaixo do `BalanceCard`
- Layout responsivo com Tailwind CSS

### 6. Frontend: Adicionar Mensagens de Sucesso/Erro

**Option A**: Usar Toast do ShadcnUI (se disponível)
**Option B**: Usar componente Alert do ShadcnUI
**Option C**: Mensagem inline temporária

**Implementation**:

- Mostrar mensagem de sucesso após transação bem-sucedida
- Mostrar mensagem de erro específica baseada no código de erro
- Auto-dismiss após 3-5 segundos

## Validation Schema (Zod)

```typescript
import { z } from 'zod';

export const transactionAmountSchema = z
  .number()
  .positive('O valor deve ser maior que zero')
  .min(0.01, 'O valor mínimo é R$ 0,01')
  .max(999999.99, 'O valor máximo é R$ 999.999,99')
  .refine(
    (val) => {
      const decimals = val.toString().split('.')[1];
      return !decimals || decimals.length <= 2;
    },
    { message: 'O valor deve ter no máximo 2 casas decimais' }
  );
```

## Testing Checklist

- [ ] Depósito com valor válido atualiza saldo
- [ ] Saque com valor válido e saldo suficiente atualiza saldo
- [ ] Saque com valor maior que saldo mostra erro
- [ ] Valores abaixo de R$ 0,01 são rejeitados
- [ ] Valores acima de R$ 999.999,99 são rejeitados
- [ ] Valores com mais de 2 decimais são rejeitados
- [ ] Botão mostra loading durante processamento
- [ ] Mensagem de sucesso é exibida após transação
- [ ] Mensagem de erro é exibida em caso de falha
- [ ] Saldo é atualizado automaticamente após transação
- [ ] Campo é limpo após sucesso
- [ ] Token expirado redireciona para login

## Next Steps

Após implementação:

1. Executar testes unitários e de integração
2. Testar manualmente no navegador
3. Verificar acessibilidade (keyboard navigation, screen readers)
4. Validar responsividade em diferentes tamanhos de tela
5. Revisar código e aplicar lint/format
