# Data Model: User Logout and Transaction History

**Feature**: User Logout and Transaction History
**Date**: 2025-12-03
**Phase**: 1 - Design & Contracts

## Entities

### Transaction (Existing - Backend)

**Purpose**: Representa uma operação bancária (depósito, saque, transferência) já persistida no banco de dados

**Attributes** (from Prisma schema):

- `id` (string, cuid): Identificador único da transação
- `type` (TransactionType enum): Tipo da transação (DEPOSIT, WITHDRAW, TRANSFER)
- `amount` (Decimal, 10,2): Valor da transação com 2 casas decimais
- `originAccountId` (string?, optional): ID da conta de origem (para saques e transferências)
- `destinationAccountId` (string?, optional): ID da conta de destino (para depósitos e transferências)
- `userId` (string?, optional): ID do usuário associado à transação
- `createdAt` (DateTime): Data e hora de criação da transação

**Relationships**:

- `originAccount` → BankAccount (opcional, para saques e transferências)
- `destinationAccount` → BankAccount (opcional, para depósitos e transferências)
- `user` → User (opcional, para associação com usuário)

**Indexes** (from Prisma schema):

- `@@index([originAccountId])`
- `@@index([destinationAccountId])`
- `@@index([createdAt])` - **Used for ordering transactions**
- `@@index([userId])` - **Used for filtering user transactions**

**Query Pattern** (for transaction history):

```typescript
// Query para histórico de transações do usuário
const transactions = await prisma.transaction.findMany({
  where: {
    userId: authenticatedUserId, // Filtro por usuário autenticado
  },
  orderBy: {
    createdAt: 'desc', // Ordenação: mais recente primeiro (FR-013)
  },
  take: 20, // Limite de 20 transações (FR-020)
  include: {
    originAccount: true, // Opcional: incluir dados da conta de origem
    destinationAccount: true, // Opcional: incluir dados da conta de destino
  },
});
```

### Transaction History Response (Frontend)

**Purpose**: Representa a resposta da API de histórico de transações formatada para exibição no frontend

**Attributes**:

- `id` (string): ID da transação
- `type` ('DEPOSIT' | 'WITHDRAW' | 'TRANSFER'): Tipo da transação
- `typeLabel` (string): Label em português ("Depósito", "Saque", "Transferência") - **Computed on frontend**
- `amount` (number): Valor da transação
- `formattedAmount` (string): Valor formatado como moeda brasileira (R$ 1.234,56) - **Computed on frontend**
- `createdAt` (string, ISO 8601): Data/hora da transação
- `formattedDateTime` (string): Data/hora formatada (03/12/2025 14:30) - **Computed on frontend**

**Transformation** (Frontend):

```typescript
// Transformação de Transaction (backend) para TransactionHistoryItem (frontend)
function transformTransaction(
  transaction: Transaction
): TransactionHistoryItem {
  return {
    id: transaction.id,
    type: transaction.type,
    typeLabel: getTransactionTypeLabel(transaction.type), // "Depósito", "Saque", "Transferência"
    amount: Number(transaction.amount),
    formattedAmount: formatCurrency(Number(transaction.amount)), // "R$ 1.234,56"
    createdAt: transaction.createdAt.toISOString(),
    formattedDateTime: formatDateTime(transaction.createdAt), // "03/12/2025 14:30"
  };
}
```

### User Session (Frontend - Existing)

**Purpose**: Representa a sessão autenticada do usuário no frontend

**Attributes** (from useAuth hook):

- `isAuthenticated` (boolean): Estado de autenticação
- `token` (string | null): Token JWT armazenado em sessionStorage
- `logout` (function): Função para realizar logout

**State Management**:

- Token armazenado em `sessionStorage` (chave: 'auth_token')
- Estado gerenciado pelo hook `useAuth`
- Logout remove token e redireciona para `/login`

## Validation Rules

### Transaction History Query

- **Authentication**: Obrigatória - endpoint requer JWT token válido (FR-018)
- **User Identification**: Automática via JWT token (userId extraído do token)
- **Limit**: Máximo de 20 transações retornadas (FR-020)
- **Ordering**: Sempre por createdAt DESC (mais recente primeiro) (FR-013)
- **Filtering**: Apenas transações do usuário autenticado (where: { userId })

### Transaction Display Formatting

- **Type Label**: Mapeamento obrigatório para português (FR-010)
  - DEPOSIT → "Depósito"
  - WITHDRAW → "Saque"
  - TRANSFER → "Transferência"
- **Amount Format**: Moeda brasileira com 2 casas decimais (FR-011)
  - Format: R$ 1.234,56
  - Example: R$ 100,50
- **DateTime Format**: Data completa + hora (FR-012)
  - Format: DD/MM/YYYY HH:mm
  - Example: "03/12/2025 14:30"
  - Locale: pt-BR

## State Transitions

### Logout Flow

```
[Authenticated User]
  → [Click Logout Button]
  → [removeToken() called]
  → [sessionStorage cleared]
  → [Token state set to null]
  → [Navigate to /login]
  → [Unauthenticated State]
```

### Transaction History Loading Flow

```
[Component Mount]
  → [useTransactions hook called]
  → [React Query fetches from API]
  → [Loading State: true]
  → [API Response received]
  → [Loading State: false]
  → [Data State: transactions array]
  → [Display transactions]
```

### Transaction History Update Flow (After New Transaction)

```
[New Transaction Completed]
  → [React Query invalidates 'transactions' query]
  → [Automatic refetch triggered]
  → [Loading State: true]
  → [Updated transactions fetched]
  → [Loading State: false]
  → [Data State: updated transactions array]
  → [Display updated transactions]
```

## Data Volume Assumptions

- **Maximum Transactions Displayed**: 20 transações (FR-020)
- **Query Performance**: Endpoint deve retornar 20 transações em <2 segundos (SC-004)
- **Update Performance**: Histórico atualiza em <1 segundo após nova transação (SC-005)
- **Database Index**: Índice em `createdAt` e `userId` garante performance adequada

## Notes

- Modelo Transaction já existe no Prisma, não requer migração
- Endpoint de histórico é read-only, não modifica dados
- Formatação de dados ocorre no frontend após receber dados do backend
- Cache do React Query reduz chamadas desnecessárias à API
- Invalidação automática do cache após novas transações garante dados atualizados
