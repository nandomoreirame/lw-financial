# Research: User Logout and Transaction History

**Feature**: User Logout and Transaction History
**Date**: 2025-12-03
**Phase**: 0 - Outline & Research

## Research Tasks

### 1. React Router 7 Header Component Pattern

**Task**: Research best practices for creating reusable header components in React Router 7 (Remix) applications

**Findings**:

**Decision**: Criar componente Header reutilizável que pode ser usado em rotas protegidas, seguindo padrão de layout do React Router 7

**Rationale**:

- React Router 7 suporta layouts compartilhados via `root.tsx` ou componentes de layout
- Header deve ser posicionado no topo da página conforme especificação (FR-001)
- Componente reutilizável permite uso futuro em outras rotas protegidas
- Integração com useAuth hook existente para funcionalidade de logout

**Alternatives Considered**:

- **Header inline no dashboard**: Mais simples, mas não reutilizável para futuras rotas
- **Layout wrapper global**: Mais complexo, header apareceria em todas as rotas (incluindo login)

**Implementation Pattern**:

```typescript
// Componente Header reutilizável
export function Header() {
  const { logout } = useAuth();

  return (
    <header className="...">
      <div className="...">
        <img src={bankSvg} alt="LW Financial" />
        <span>LW Financial</span>
      </div>
      <Button onClick={logout}>Sair</Button>
    </header>
  );
}
```

**Key Points**:

- Header deve ser posicionado no topo da página (FR-001)
- Deve incluir logo "LW Financial" e ícone bank.svg
- Botão de logout deve usar função logout do useAuth hook existente
- Estilização usando Tailwind CSS v4 e ShadcnUI Button component

### 2. Transaction History Display Patterns

**Task**: Research best practices for displaying transaction history lists in React applications with React Query

**Findings**:

**Decision**: Usar React Query para fetch e cache de histórico de transações, com componente de lista usando ShadcnUI Card/Table components

**Rationale**:

- React Query já está sendo usado no projeto (use-balance, use-deposit, use-withdraw)
- Cache automático e invalidação após novas transações (FR-014)
- Estados de loading e error já gerenciados pelo React Query
- ShadcnUI fornece componentes de lista/card apropriados

**Alternatives Considered**:

- **useState + useEffect**: Mais manual, requer gerenciamento de estados manual
- **SWR**: Alternativa ao React Query, mas projeto já usa React Query

**Implementation Pattern**:

```typescript
// Hook use-transactions
export function useTransactions(userId: string | null) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => getTransactions(),
    enabled: !!userId,
  });
}

// Componente TransactionHistory
export function TransactionHistory() {
  const { data, isLoading, error } = useTransactions(userId);

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage />;
  if (!data?.length) return <EmptyState />;

  return (
    <div>
      {data.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
```

**Key Points**:

- Exibir 20 transações mais recentes (FR-020)
- Ordenação por createdAt DESC (FR-013)
- Formatação de tipo em português (FR-010)
- Formatação de valor em R$ (FR-011)
- Formatação de data/hora completa (FR-012)

### 3. Date/Time Formatting in React

**Task**: Research best practices for formatting dates and times in React applications (Brazilian format: 03/12/2025 14:30)

**Findings**:

**Decision**: Usar Intl.DateTimeFormat ou date-fns para formatação de data/hora no formato brasileiro

**Rationale**:

- Intl.DateTimeFormat é nativo do JavaScript, sem dependências
- date-fns oferece mais flexibilidade e formatação consistente
- Formato brasileiro: DD/MM/YYYY HH:mm
- Suporta timezone handling se necessário

**Alternatives Considered**:

- **moment.js**: Biblioteca pesada, em modo de manutenção
- **dayjs**: Mais leve que moment, mas Intl.DateTimeFormat é suficiente

**Implementation Pattern**:

```typescript
// Usando Intl.DateTimeFormat (nativo)
export function formatDateTime(date: Date): string {
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return `${dateStr} ${timeStr}`;
}

// Ou usando date-fns (se já estiver no projeto)
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}
```

**Key Points**:

- Formato: "03/12/2025 14:30" (FR-012)
- Locale: pt-BR (português brasileiro)
- Timezone: Usar timezone do servidor ou UTC conforme backend

### 4. Backend Transaction History Endpoint Design

**Task**: Research best practices for designing REST API endpoint for transaction history with pagination and filtering

**Findings**:

**Decision**: Criar endpoint GET `/v1/transactions` que retorna as 20 transações mais recentes do usuário autenticado, ordenadas por createdAt DESC

**Rationale**:

- Endpoint simples sem paginação (conforme Out of Scope)
- Autenticação via JWT token (FR-018)
- Limite fixo de 20 transações (FR-020)
- Ordenação por createdAt DESC (FR-013)
- Identificação automática do usuário via JWT (seguindo padrão do balance endpoint)

**Alternatives Considered**:

- **Endpoint com paginação**: Mais flexível, mas fora do escopo desta feature
- **Endpoint com filtros**: Mais complexo, não necessário para MVP

**Implementation Pattern**:

```typescript
// Handler transactions.ts
export async function transactionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authRequest = request as AuthenticatedRequest;
  const userId = authRequest.user.userId;

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      originAccount: true,
      destinationAccount: true,
    },
  });

  return reply.status(200).send(transactions);
}
```

**Key Points**:

- Autenticação obrigatória (preHandler: authenticateRequest)
- Retorna apenas transações do usuário autenticado
- Limite de 20 transações (take: 20)
- Ordenação por createdAt DESC
- Incluir relacionamentos de contas se necessário para exibição

### 5. Transaction Type Localization

**Task**: Research best practices for displaying transaction types in Portuguese in React components

**Findings**:

**Decision**: Criar função de mapeamento de tipos de transação (DEPOSIT, WITHDRAW, TRANSFER) para labels em português

**Rationale**:

- Tipos no backend são em inglês (enum TransactionType)
- Frontend deve exibir em português conforme especificação (FR-010)
- Função de mapeamento centralizada facilita manutenção
- Permite futura internacionalização se necessário

**Alternatives Considered**:

- **i18n library**: Mais complexo, não necessário para apenas 3 tipos
- **Hardcoded no componente**: Menos manutenível

**Implementation Pattern**:

```typescript
// Função de mapeamento
export function getTransactionTypeLabel(
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'
): string {
  const labels = {
    DEPOSIT: 'Depósito',
    WITHDRAW: 'Saque',
    TRANSFER: 'Transferência',
  };
  return labels[type] || type;
}
```

**Key Points**:

- Mapeamento: DEPOSIT → "Depósito", WITHDRAW → "Saque", TRANSFER → "Transferência"
- Função centralizada para reutilização
- Type-safe com TypeScript

## Consolidated Decisions

1. **Header Component**: Componente reutilizável Header com logo, ícone e botão logout usando useAuth hook
2. **Transaction History**: React Query hook use-transactions com componente TransactionHistory usando ShadcnUI
3. **Date/Time Formatting**: Intl.DateTimeFormat ou date-fns para formato brasileiro (DD/MM/YYYY HH:mm)
4. **Backend Endpoint**: GET `/v1/transactions` com autenticação, limite de 20, ordenação DESC
5. **Type Localization**: Função de mapeamento centralizada para tipos em português
