# Data Model: Dashboard Deposit and Withdraw Operations

**Feature**: 005-deposit-withdraw
**Date**: 2025-12-02

## Entities

### Deposit Transaction

**Description**: Representa uma operação de depósito de dinheiro na conta do usuário.

**Attributes**:

- `amount` (number, required): Valor do depósito em reais (R$). Mínimo: 0.01, Máximo: 999999.99, Precisão: 2 casas decimais
- `timestamp` (DateTime, auto-generated): Data e hora da transação (gerado automaticamente pelo backend)
- `accountId` (string, derived): ID da conta de destino (derivado do userId do token JWT no backend)
- `userId` (string, derived): ID do usuário autenticado (extraído do token JWT)

**Validation Rules**:

- `amount` deve ser um número positivo maior que zero
- `amount` deve estar entre R$ 0,01 e R$ 999.999,99
- `amount` deve ter exatamente 2 casas decimais
- `amount` não pode ser `NaN` ou `Infinity`

**State Transitions**:

- `pending` → `processing` → `completed` (sucesso) ou `failed` (erro)
- Estados gerenciados pelo React Query mutation

**Relationships**:

- Pertence a um `Account` (via `destinationAccountId`)
- Pertence a um `User` (via `userId`)

### Withdrawal Transaction

**Description**: Representa uma operação de saque de dinheiro da conta do usuário.

**Attributes**:

- `amount` (number, required): Valor do saque em reais (R$). Mínimo: 0.01, Máximo: 999999.99, Precisão: 2 casas decimais
- `timestamp` (DateTime, auto-generated): Data e hora da transação (gerado automaticamente pelo backend)
- `accountId` (string, derived): ID da conta de origem (derivado do userId do token JWT no backend)
- `userId` (string, derived): ID do usuário autenticado (extraído do token JWT)

**Validation Rules**:

- `amount` deve ser um número positivo maior que zero
- `amount` deve estar entre R$ 0,01 e R$ 999.999,99
- `amount` deve ter exatamente 2 casas decimais
- `amount` não pode exceder o saldo atual da conta (validado no backend)
- `amount` não pode ser `NaN` ou `Infinity`

**State Transitions**:

- `pending` → `processing` → `completed` (sucesso) ou `failed` (erro ou saldo insuficiente)
- Estados gerenciados pelo React Query mutation

**Relationships**:

- Pertence a um `Account` (via `originAccountId`)
- Pertence a um `User` (via `userId`)

### Account Balance (Existing)

**Description**: Saldo atual da conta bancária do usuário (já existe, usado por US-016).

**Attributes**:

- `balance` (number): Saldo atual em reais (R$)
- `accountId` (string): ID da conta (derivado do userId)
- `userId` (string): ID do usuário autenticado

**State Changes**:

- Atualizado automaticamente após depósito bem-sucedido (aumenta)
- Atualizado automaticamente após saque bem-sucedido (diminui)
- Atualizado via invalidação de cache do React Query

## Data Flow

### Deposit Flow

1. Usuário preenche formulário com valor
2. Frontend valida valor (0.01 a 999999.99, 2 decimais)
3. Frontend envia POST `/v1/event` com `{ type: "deposit", amount: number }`
4. Backend extrai `userId` do token JWT
5. Backend obtém conta padrão via `getOrCreateDefaultAccount(userId)`
6. Backend processa depósito via `accountService.deposit(accountId, amount, userId)`
7. Backend retorna `{ destination: { id, balance } }`
8. Frontend invalida cache de saldo
9. Frontend atualiza exibição de saldo
10. Frontend mostra mensagem de sucesso

### Withdraw Flow

1. Usuário preenche formulário com valor
2. Frontend valida valor (0.01 a 999999.99, 2 decimais)
3. Frontend valida que valor não excede saldo atual (opcional, melhor UX)
4. Frontend envia POST `/v1/event` com `{ type: "withdraw", amount: number }`
5. Backend extrai `userId` do token JWT
6. Backend obtém conta padrão via `getOrCreateDefaultAccount(userId)`
7. Backend valida saldo suficiente
8. Backend processa saque via `accountService.withdraw(accountId, amount, userId)`
9. Backend retorna `{ origin: { id, balance } }` ou erro 400 (saldo insuficiente)
10. Frontend invalida cache de saldo
11. Frontend atualiza exibição de saldo
12. Frontend mostra mensagem de sucesso ou erro

## Validation Rules Summary

### Frontend Validation (Client-side)

- Valor mínimo: R$ 0,01
- Valor máximo: R$ 999.999,99
- Precisão: exatamente 2 casas decimais
- Tipo: número positivo
- Formato: aceitar entrada como número ou string formatada (R$ 1.234,56)

### Backend Validation (Server-side)

- Mesmas regras do frontend (validação dupla por segurança)
- Saldo suficiente para saques (validado no backend)
- Autenticação válida (token JWT)
- Conta existe ou é criada automaticamente

## Error States

### Client-side Errors

- `VALIDATION_ERROR`: Valor inválido (fora dos limites, formato incorreto)
- `INSUFFICIENT_FUNDS`: Tentativa de saque maior que saldo (detectado antes de enviar)
- `NETWORK_ERROR`: Falha de conexão ou timeout
- `AUTH_ERROR`: Token expirado ou inválido (401)

### Server-side Errors

- `400 Bad Request`: Valor inválido ou saldo insuficiente
- `401 Unauthorized`: Token JWT inválido ou expirado
- `404 Not Found`: Conta não encontrada (não deve acontecer com identificação automática)
- `500 Internal Server Error`: Erro interno do servidor
