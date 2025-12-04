# Data Model: Multi-Account Management with Account Code Routing

**Feature**: Multi-Account Management with Account Code Routing
**Date**: 2025-12-03
**Phase**: 1 - Design & Contracts

## Entities

### BankAccount (Updated)

**Description**: Representa uma conta bancária pertencente a um usuário, agora com código único para identificação e roteamento.

**Attributes**:

- `id` (String, cuid, required): Identificador único da conta (já existe)
- `code` (String, required, unique): Código único no formato "XXXX-X" (4 dígitos, hífen, 1 dígito)
  - Format: Regex pattern `^\d{4}-\d$`
  - Example: "1234-5"
  - Uniqueness: Constraint `@unique` no banco de dados
  - Generation: Automático durante criação da conta
  - Immutability: Não pode ser alterado após criação (FR-007)
- `balance` (Decimal, required): Saldo atual da conta (já existe)
  - Type: Decimal(10, 2)
- `userId` (String, optional): ID do usuário proprietário (já existe, relação 1:N)
- `createdAt` (DateTime, auto-generated): Timestamp de criação (já existe)
- `updatedAt` (DateTime, auto-updated): Timestamp de última atualização (já existe)

**Validation Rules**:

- `code` deve seguir formato exato "XXXX-X" (4 dígitos, hífen, 1 dígito)
- `code` deve ser único em todo o sistema (constraint no banco)
- `code` é gerado automaticamente, não aceita input do usuário
- `code` não pode ser alterado após criação

**State Transitions**:

- Account creation: `code` é gerado automaticamente antes de salvar no banco
- Code generation retry: Se código gerado já existe, novo código é gerado (até 10 tentativas)

**Relationships**:

- Pertence a um `User` (via `userId`, relação 1:N - um usuário pode ter múltiplas contas)
- Tem múltiplas transações como origem (via `originTransactions`)
- Tem múltiplas transações como destino (via `destinationTransactions`)

**Database Changes**:

```prisma
model BankAccount {
  id        String   @id @default(cuid())
  code      String   @unique // NOVO: Campo de código único
  balance   Decimal  @db.Decimal(10, 2)
  userId    String?
  user      User?    @relation("BankAccounts", fields: [userId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  originTransactions      Transaction[] @relation("OriginAccount")
  destinationTransactions Transaction[] @relation("DestinationAccount")

  @@index([userId])
  @@index([code]) // NOVO: Índice para busca rápida por código
  @@map("bank_account")
}
```

### User (Existing - Relationship Clarified)

**Description**: Usuário autenticado que pode possuir múltiplas contas bancárias.

**Attributes**: (sem mudanças, relação já existe)

**Relationships**:

- Possui múltiplas `BankAccount` entities (relação 1:N já existe no schema)
- Primeira conta: Determinada pelo `createdAt` mais antigo (clareza adicionada)

### Transaction (Existing - Filtering Enhancement)

**Description**: Operação bancária que pode estar associada a uma ou duas contas.

**Attributes**: (sem mudanças estruturais)

**Filtering Enhancement**:

- Filtro por conta: Transações podem ser filtradas por `originAccountId` ou `destinationAccountId`
- Busca por código: Buscar conta por código, depois filtrar transações por account ID
- Transferências: Aparecem na conta de origem (sent) ou destino (received)

**Relationships**: (sem mudanças)

## Data Flow

### Account Creation Flow

1. Usuário cria nova conta (via onboarding ou criação manual)
2. Sistema gera código único no formato "XXXX-X"
3. Sistema verifica se código já existe no banco
4. Se código existe, gera novo código (retry até 10 vezes)
5. Sistema cria conta com código único em transação atômica
6. Constraint `@unique` no banco garante unicidade final
7. Conta é associada ao usuário autenticado automaticamente

### Account Routing Flow

1. Usuário navega para `/conta/[AccountCode]`
2. Frontend valida formato do código via regex (`^\d{4}-\d$`)
3. Frontend envia requisição GET `/v1/accounts/:code` com token JWT
4. Backend valida token e extrai `userId`
5. Backend busca conta por código no banco
6. Backend valida que conta pertence ao usuário (`userId` match)
7. Backend retorna dados da conta (ou 404 se não encontrada/não autorizada)
8. Frontend exibe dashboard com dados da conta específica

### Account Selection Flow

1. Usuário visualiza sidebar com lista de contas
2. Sistema busca todas as contas do usuário via GET `/v1/accounts`
3. Sistema exibe dropdown com códigos de conta (ou apenas código se apenas uma conta)
4. Usuário seleciona conta no dropdown
5. Frontend atualiza URL para `/conta/[SelectedAccountCode]`
6. Roteamento carrega dados da nova conta
7. Dashboard e histórico são atualizados para a conta selecionada

### Transaction Filtering Flow

1. Usuário está visualizando conta específica (`/conta/1234-5`)
2. Frontend envia GET `/v1/transactions?accountCode=1234-5`
3. Backend busca conta por código
4. Backend filtra transações onde conta é origem OU destino
5. Backend retorna transações filtradas ordenadas por data (mais recente primeiro)
6. Frontend exibe apenas transações da conta selecionada

### Deposit/Withdraw Flow (Updated)

1. Usuário está visualizando conta específica (`/conta/1234-5`)
2. Usuário realiza depósito ou saque
3. Frontend envia POST `/v1/event` com `{ type: "deposit|withdraw", amount: number, accountCode: "1234-5" }`
4. Backend valida `accountCode` e busca conta
5. Backend valida propriedade da conta (usuário autenticado)
6. Backend processa transação na conta especificada
7. Backend retorna dados atualizados da conta
8. Frontend atualiza exibição de saldo e histórico

## Validation Rules Summary

### Account Code Validation

**Format Validation**:

- Regex: `^\d{4}-\d$`
- 4 dígitos numéricos, hífen, 1 dígito numérico
- Example válido: "1234-5"
- Examples inválidos: "123-45", "12345", "abcd-5"

**Uniqueness Validation**:

- Constraint `@unique` no banco de dados
- Verificação antes de inserir (com retry se conflito)
- Erro se não conseguir gerar código único após retries

**Immutability**:

- Código não pode ser alterado após criação
- Nenhum endpoint permite atualização do campo `code`

### Account Ownership Validation

**URL Parameter Validation**:

- Código na URL deve ter formato válido
- Conta deve existir no banco
- Conta deve pertencer ao usuário autenticado

**Transaction Validation**:

- `accountCode` em requisições de depósito/saque deve ser válido
- Conta deve pertencer ao usuário autenticado
- Validação tanto no frontend quanto no backend

## Error States

### Account Code Errors

- `INVALID_CODE_FORMAT`: Código não segue padrão "XXXX-X"
- `CODE_NOT_FOUND`: Código não existe no banco
- `CODE_ACCESS_DENIED`: Código existe mas não pertence ao usuário
- `CODE_GENERATION_FAILED`: Não foi possível gerar código único após retries

### Account Routing Errors

- `400 Bad Request`: Formato de código inválido
- `404 Not Found`: Conta não encontrada ou acesso negado
- `401 Unauthorized`: Token JWT inválido ou expirado
- `500 Internal Server Error`: Erro interno do servidor

## Database Migration

### Migration Steps

1. Adicionar campo `code` ao modelo `BankAccount` no schema Prisma
2. Adicionar constraint `@unique` no campo `code`
3. Adicionar índice no campo `code` para busca rápida
4. Gerar migração Prisma
5. Para contas existentes: gerar códigos retroativamente (se necessário)

### Migration Script Example

```typescript
// Para contas existentes sem código
async function backfillAccountCodes() {
  const accountsWithoutCode = await prisma.bankAccount.findMany({
    where: { code: null },
  });

  for (const account of accountsWithoutCode) {
    const code = await generateUniqueAccountCode();
    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { code },
    });
  }
}
```

## Indexes for Performance

- `@@index([code])`: Busca rápida de conta por código
- `@@index([userId])`: Listagem rápida de contas do usuário (já existe)
- Índices compostos não necessários para padrão de acesso atual
