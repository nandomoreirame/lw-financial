# Data Model: Interface de Autenticação e Dashboard de Saldo

**Feature**: 004-auth-dashboard
**Date**: 2025-12-02

## Entities

### User Session

**Description**: Representa o estado autenticado do usuário após login bem-sucedido.

**Fields**:

- `token` (string, required): Token JWT recebido do endpoint `/login`
- `userId` (string, optional): ID do usuário extraído do payload do JWT
- `username` (string, optional): Username do usuário extraído do payload do JWT
- `expiresAt` (number, optional): Timestamp de expiração do token (extraído do payload JWT)

**Storage**:

- Client-side: `sessionStorage` (chave: `auth_token`)
- Server-side: httpOnly cookie (gerenciado via React Router 7)

**Validation Rules**:

- Token deve ser string não vazia
- Token deve ser JWT válido (formato: `header.payload.signature`)
- Token deve conter payload decodificável com campos `userId`, `username`, `exp` (expiration)

**State Transitions**:

1. **Unauthenticated** → **Authenticated**: Após login bem-sucedido, token armazenado
2. **Authenticated** → **Unauthenticated**: Token expirado ou logout, token removido
3. **Authenticated** → **Unauthenticated**: Token inválido detectado, redirecionamento para login

**Lifecycle**:

- Criado: Após POST `/login` bem-sucedido
- Atualizado: N/A (token é imutável)
- Destruído: Logout, expiração de token, ou fechamento de aba (sessionStorage)

---

### Account Balance

**Description**: Representa o saldo atual da conta bancária do usuário autenticado.

**Fields**:

- `balance` (number, required): Valor do saldo em formato numérico (ex: 1234.56)
- `accountId` (string, required): ID da conta bancária associada ao usuário autenticado
- `formattedBalance` (string, computed): Saldo formatado como Real brasileiro (ex: "R$ 1.234,56")
- `lastUpdated` (number, optional): Timestamp da última atualização do saldo

**Storage**:

- Client-side: Cache do React Query (chave: `['balance', accountId]`)
- Server-side: Banco de dados PostgreSQL (via endpoint `/balance`)

**Validation Rules**:

- Balance deve ser número válido (pode ser 0 ou negativo)
- accountId deve ser string não vazia
- formattedBalance deve seguir formato brasileiro: `R$ X.XXX,XX`

**State Transitions**:

1. **Loading** → **Loaded**: Após GET `/balance` bem-sucedido
2. **Loaded** → **Error**: Falha na requisição, exibir mensagem de erro
3. **Loaded** → **Loading**: Atualização manual (refresh) ou automática após operação bancária
4. **Empty** → **Loaded**: Quando saldo não disponível inicialmente, depois disponibilizado

**Lifecycle**:

- Criado: Após GET `/balance` bem-sucedido
- Atualizado: Após operações bancárias (depósito, saque, transferência) ou refresh manual
- Invalidado: Após operações bancárias para forçar refetch

---

## Relationships

### User Session ↔ Account Balance

**Type**: One-to-One (indireto via accountId)

**Description**: Uma sessão de usuário autenticado está associada a uma conta bancária através do `accountId` extraído do token JWT ou obtido do backend.

**Constraints**:

- accountId deve existir e ser válido para buscar saldo
- Se accountId não existir, exibir mensagem "Saldo não disponível no momento"

---

## Data Flow

### Authentication Flow

```
1. User submits login form (username, password)
2. POST /login → Backend validates credentials
3. Backend returns JWT token
4. Frontend stores token in sessionStorage + sets httpOnly cookie
5. Frontend redirects to /dashboard
```

### Balance Fetching Flow

```
1. Dashboard route loader checks authentication (validates JWT)
2. Extract accountId from JWT payload or fetch from backend
3. GET /balance?account_id={accountId} → Backend returns balance
4. React Query caches balance data
5. Component displays formatted balance (R$ X.XXX,XX)
```

### Balance Update Flow

```
1. User performs banking operation (deposit, withdrawal, transfer)
2. Operation completes successfully
3. React Query invalidates balance cache
4. Automatic refetch of balance
5. UI updates with new balance within 3 seconds (SC-005)
```

---

## Formatting Rules

### Currency Format (Brazilian Real)

**Format**: `R$ X.XXX,XX`

**Rules**:

- Prefixo: "R$ " (com espaço)
- Separador de milhar: ponto (.)
- Separador decimal: vírgula (,)
- Mínimo 2 casas decimais
- Exemplos:
  - `0` → `R$ 0,00`
  - `1234.56` → `R$ 1.234,56`
  - `1000000` → `R$ 1.000.000,00`

**Implementation**: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`

---

## Error States

### Authentication Errors

- **Invalid Credentials**: Exibir mensagem "Credenciais inválidas" sem redirecionar
- **Token Expired**: Redirecionar para `/login` com mensagem "Sua sessão expirou. Por favor, faça login novamente"
- **Token Invalid**: Redirecionar para `/login` com mensagem informativa

### Balance Errors

- **Network Error**: Exibir mensagem "Erro ao carregar saldo. Tente novamente."
- **Server Error**: Exibir mensagem "Servidor indisponível. Tente novamente mais tarde."
- **Account Not Found**: Exibir mensagem "Saldo não disponível no momento"
- **Unauthorized**: Redirecionar para `/login` (token inválido/expirado)

---

## Validation Summary

| Entity          | Field            | Validation                         | Error Message            |
| --------------- | ---------------- | ---------------------------------- | ------------------------ |
| User Session    | token            | Non-empty string, valid JWT format | "Token inválido"         |
| User Session    | expiresAt        | Valid timestamp, not expired       | "Sessão expirada"        |
| Account Balance | balance          | Valid number                       | N/A (backend validation) |
| Account Balance | accountId        | Non-empty string                   | "Conta não encontrada"   |
| Account Balance | formattedBalance | Matches R$ X.XXX,XX format         | N/A (computed)           |
