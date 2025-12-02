# Quick Start: Interface de Autenticação e Dashboard de Saldo

**Feature**: 004-auth-dashboard
**Date**: 2025-12-02

## Overview

Este guia fornece instruções rápidas para implementar a interface de autenticação (tela de login) e dashboard de visualização de saldo no frontend usando React Router 7.

## Prerequisites

- Backend rodando com endpoints `/login` e `/balance` funcionais
- React Router 7 (Remix) configurado no projeto
- React Query (@tanstack/react-query) instalado
- ShadcnUI e Tailwind CSS v4 configurados

## Setup

### 1. Instalar Dependências (se necessário)

```bash
cd apps/frontend
bun install
```

### 2. Criar Estrutura de Arquivos

```bash
# Criar diretórios
mkdir -p app/routes
mkdir -p app/components/login
mkdir -p app/components/dashboard
mkdir -p app/hooks
mkdir -p app/lib
mkdir -p app/middleware
```

## Implementation Steps

### Step 1: Criar Utilitários de Autenticação

**File**: `app/lib/auth.ts`

```typescript
// Funções para gerenciar token JWT
export function storeToken(token: string): void;
export function getToken(): string | null;
export function removeToken(): void;
export function isTokenExpired(token: string): boolean;
export function decodeToken(
  token: string
): { userId?: string; username?: string; exp?: number } | null;
```

### Step 2: Criar Cliente API

**File**: `app/lib/api.ts`

```typescript
// Funções para chamadas API
export async function login(
  username: string,
  password: string
): Promise<{ token: string }>;
export async function getBalance(accountId: string): Promise<number>;
```

### Step 3: Criar Hook de Autenticação

**File**: `app/hooks/use-auth.ts`

```typescript
// Hook para gerenciar estado de autenticação
export function useAuth(): {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
};
```

### Step 4: Criar Hook de Saldo

**File**: `app/hooks/use-balance.ts`

```typescript
// Hook para buscar e gerenciar saldo usando React Query
export function useBalance(accountId: string): {
  balance: number | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  formattedBalance: string;
};
```

### Step 5: Criar Componente de Login

**File**: `app/components/login/login-form.tsx`

- Formulário com campos username e password
- Validação usando react-hook-form + zod
- Integração com hook useAuth
- Exibição de erros de autenticação
- Redirecionamento para dashboard após login bem-sucedido

### Step 6: Criar Componente de Saldo

**File**: `app/components/dashboard/balance-card.tsx`

- Exibição de saldo formatado (R$ X.XXX,XX)
- Skeleton loader durante carregamento
- Mensagem informativa quando saldo não disponível
- Botão de refresh manual

### Step 7: Criar Rota de Login

**File**: `app/routes/login.tsx`

- Rota pública `/login`
- Renderiza componente LoginForm
- Redireciona para dashboard se já autenticado

### Step 8: Criar Rota de Dashboard

**File**: `app/routes/dashboard.tsx`

- Rota protegida `/dashboard`
- Loader verifica autenticação (valida JWT)
- Redireciona para login se não autenticado ou token expirado
- Renderiza componente BalanceCard
- Integra com hook useBalance

### Step 9: Criar Middleware de Proteção de Rotas

**File**: `app/middleware/protected-route.ts`

- Função helper para verificar autenticação em loaders
- Valida token JWT
- Verifica expiração
- Retorna redirecionamento se necessário

### Step 10: Atualizar Configuração de Rotas

**File**: `app/routes.ts`

```typescript
import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('login', 'routes/login.tsx'),
  route('dashboard', 'routes/dashboard.tsx'),
] satisfies RouteConfig;
```

## Key Implementation Details

### Token Storage

```typescript
// Client-side (sessionStorage)
sessionStorage.setItem('auth_token', token);

// Server-side (httpOnly cookie via React Router 7)
// Gerenciado automaticamente pelo React Router 7 em loaders/actions
```

### Formatação de Moeda

```typescript
const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatted = formatter.format(1234.56); // "R$ 1.234,56"
```

### Validação de Token Expirado

```typescript
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}
```

### Atualização Automática de Saldo

```typescript
// Após operação bancária bem-sucedida
queryClient.invalidateQueries({ queryKey: ['balance', accountId] });
```

## Testing

### Testes Unitários

```bash
# Testar componentes
bun test app/components/login/login-form.test.tsx
bun test app/components/dashboard/balance-card.test.tsx
```

### Testes de Integração

```bash
# Testar fluxo completo
bun test tests/integration/login-flow.test.ts
bun test tests/integration/dashboard-flow.test.ts
```

## Success Criteria Checklist

- [ ] Login completo em <5 segundos (SC-001)
- [ ] 100% de logins bem-sucedidos armazenam token e redirecionam (SC-002)
- [ ] Saldo exibido em <2 segundos após carregamento (SC-003)
- [ ] Saldo atualizado automaticamente após operações (SC-005)
- [ ] Token expirado redireciona para login com mensagem (FR-013)
- [ ] Skeleton loader exibido durante carregamento (FR-014)
- [ ] Mensagem informativa quando saldo não disponível (FR-015)

## Next Steps

Após implementação básica:

1. Adicionar testes de integração
2. Implementar tratamento de erros robusto
3. Adicionar acessibilidade (ARIA labels, keyboard navigation)
4. Otimizar performance (lazy loading, code splitting)
5. Adicionar analytics/monitoring

## References

- [React Router 7 Documentation](https://reactrouter.com/)
- [TanStack Query Documentation](https://tanstack.com/query)
- [ShadcnUI Components](https://ui.shadcn.com/)
- [Intl.NumberFormat MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
