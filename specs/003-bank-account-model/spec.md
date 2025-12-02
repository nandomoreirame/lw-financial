# Feature Specification: Modelagem de Dados de Contas Bancárias

**Feature Branch**: `003-bank-account-model`
**Created**: 2025-12-02
**Status**: Draft
**Input**: User description: "Operações Bancárias - Fazer modelagem de dados de contas bancárias no @apps/backend/prisma/schema.prisma - @fase-2-operacoes-bancarias @docs/histories/fase-2-operacoes-bancarias/README.md"

## Clarifications

### Session 2025-12-02

- Q: Como nomear o modelo de conta bancária considerando que já existe um modelo `Account` para OAuth? → A: Criar novo modelo `BankAccount` separado do `Account` existente (OAuth)
- Q: O identificador account_id usado nas APIs é o mesmo que o id interno (cuid) ou um campo separado? → A: account_id é o mesmo que o id (cuid) - usar o id diretamente nas APIs
- Q: Qual tipo de dados usar para valores monetários (saldo e valores de transação)? → A: Usar Decimal do Prisma com precisão padrão (@db.Decimal(10, 2) - 10 dígitos totais, 2 decimais)
- Q: Como representar o tipo de transação (deposit, withdraw, transfer) no modelo de dados? → A: Usar Enum do Prisma (enum TransactionType { DEPOSIT, WITHDRAW, TRANSFER })
- Q: Como modelar a relação opcional com User (campo userId nullable ou sem relação)? → A: Campo userId nullable (String?) com relação opcional no Prisma

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Armazenar Informações de Contas Bancárias (Priority: P1)

Como sistema bancário, eu preciso armazenar informações de contas bancárias para que possa rastrear saldos e processar operações financeiras.

**Why this priority**: A modelagem de contas é a base fundamental para todas as operações bancárias. Sem uma estrutura de dados adequada para contas, nenhuma operação (depósito, saque, transferência, consulta de saldo) pode ser implementada. É o primeiro passo crítico para habilitar as funcionalidades da Fase 2.

**Independent Test**: Pode ser totalmente testado criando um registro de conta no banco de dados e verificando que todos os campos obrigatórios são armazenados corretamente. Entrega valor imediato ao permitir que o sistema armazene e recupere informações de contas.

**Acceptance Scenarios**:

1. **Given** o sistema está configurado, **When** uma nova conta é criada, **Then** o sistema armazena um identificador único, saldo inicial e informações de auditoria (criação e atualização)
2. **Given** uma conta existe no sistema, **When** uma consulta é realizada, **Then** o sistema retorna o identificador único e saldo atual
3. **Given** uma conta existe no sistema, **When** uma operação modifica o saldo, **Then** o sistema atualiza o saldo e registra o momento da atualização

---

### User Story 2 - Rastrear Histórico de Transações (Priority: P1)

Como sistema bancário, eu preciso rastrear todas as transações realizadas para que possa fornecer histórico e auditoria de operações financeiras.

**Why this priority**: O rastreamento de transações é essencial para auditoria, histórico de operações (US-020) e para permitir análises de fluxo financeiro. Todas as operações (depósito, saque, transferência) devem ser registradas para garantir rastreabilidade e conformidade.

**Independent Test**: Pode ser totalmente testado criando uma transação e verificando que tipo, valores, contas envolvidas e timestamps são armazenados corretamente. Entrega valor imediato ao permitir rastreabilidade completa de operações.

**Acceptance Scenarios**:

1. **Given** o sistema está configurado, **When** uma transação é criada (depósito, saque ou transferência), **Then** o sistema armazena tipo, valor, contas envolvidas e timestamps
2. **Given** múltiplas transações existem no sistema, **When** uma consulta de histórico é realizada, **Then** o sistema retorna transações ordenadas por data de criação
3. **Given** uma transferência é realizada, **When** a transação é criada, **Then** o sistema registra tanto a conta de origem quanto a de destino

---

### Edge Cases

- Como o sistema diferencia entre conta de origem e destino em transferências? (Usar campos separados na transação: originAccountId e destinationAccountId)
- O que acontece quando uma conta é consultada mas não existe? (Retornar erro 404 - tratamento fora do escopo desta especificação, mas a estrutura de dados deve permitir essa verificação)
- Como o sistema identifica uma conta unicamente? (O id (cuid) do modelo BankAccount é usado diretamente nas APIs como account_id)
- O sistema precisa manter histórico permanente de transações ou pode ser limpo? (Histórico deve ser mantido para auditoria, mas pode ser limpo através de endpoint /reset para testes)
- Como o sistema garante que saldos não fiquem negativos? (Validação de regra de negócio fora do escopo - estrutura de dados deve permitir saldo negativo para permitir validação na camada de aplicação)
- O sistema precisa rastrear qual usuário realizou cada transação? (Sim, para auditoria e segurança - relacionar transações com usuários autenticados)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST store bank account information with a unique identifier (id using cuid) that is used directly in API endpoints as account_id
- **FR-002**: System MUST store current balance for each bank account
- **FR-003**: System MUST track creation timestamp for each bank account
- **FR-004**: System MUST track last update timestamp for each bank account
- **FR-005**: System MUST support storing account information independently of user authentication (accounts can exist with only account_id and balance)
- **FR-006**: System MUST optionally associate accounts with authenticated users for audit and security purposes
- **FR-007**: System MUST store transaction records with unique identifiers
- **FR-008**: System MUST store transaction type using Prisma Enum (TransactionType: DEPOSIT, WITHDRAW, TRANSFER)
- **FR-009**: System MUST store transaction amount (value transferred)
- **FR-010**: System MUST store origin account identifier for transactions that have an origin (withdraw, transfer)
- **FR-011**: System MUST store destination account identifier for transactions that have a destination (deposit, transfer)
- **FR-012**: System MUST allow transactions to have both origin and destination (for transfers)
- **FR-013**: System MUST allow transactions to have only destination (for deposits)
- **FR-014**: System MUST allow transactions to have only origin (for withdrawals)
- **FR-015**: System MUST track creation timestamp for each transaction
- **FR-016**: System MUST optionally associate transactions with authenticated users who performed the operation
- **FR-017**: System MUST enable efficient querying of account balance by account identifier
- **FR-018**: System MUST enable efficient querying of transaction history for a specific account
- **FR-019**: System MUST enable efficient querying of all transactions ordered by creation time
- **FR-020**: System MUST support deletion of all accounts and transactions (for reset functionality)
- **FR-021**: System MUST use sequential, collision-resistant identifiers (cuid) for all primary keys as per project policy
- **FR-022**: System MUST maintain referential integrity between transactions and accounts (transactions reference accounts that exist)

### Key Entities _(include if feature involves data)_

- **BankAccount**: Represents a bank account in the system. The Prisma model will be named `BankAccount` to distinguish it from the existing `Account` model used for OAuth authentication. Contains a unique identifier (id using cuid) that is used directly in API endpoints as account_id, current balance (Decimal type with @db.Decimal(10, 2) precision), optional association with authenticated user (userId nullable String? with optional relation) for audit purposes, and timestamps for creation and last update. Must support efficient queries by id (which serves as account_id in APIs).

- **Transaction**: Represents a financial transaction in the system. Contains a unique identifier, transaction type (Prisma Enum: TransactionType with values DEPOSIT, WITHDRAW, TRANSFER), transaction amount (Decimal type with @db.Decimal(10, 2) precision), optional origin account identifier (for withdraw and transfer operations), optional destination account identifier (for deposit and transfer operations), optional association with authenticated user who performed the operation (userId nullable String? with optional relation), and creation timestamp. Must support efficient queries by account (both origin and destination) and ordering by creation time for history retrieval.

- **BankAccount-Transaction Relationship**: Represents the relationship between bank accounts (BankAccount model) and transactions. A single bank account can have multiple transactions. Transactions can reference zero or one origin account and zero or one destination account. This relationship enables querying transaction history for accounts and maintaining referential integrity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: System can store and retrieve bank account information with 100% data integrity (all fields are persisted and retrieved correctly)
- **SC-002**: System can query account balance by account identifier in under 50ms
- **SC-003**: System can store transaction records with all required information (type, amount, accounts, timestamps) with 100% data integrity
- **SC-004**: System can query transaction history for a specific account (including both origin and destination transactions) in under 100ms for accounts with up to 1000 transactions
- **SC-005**: System can query all transactions ordered by creation time in under 200ms for up to 10,000 transactions
- **SC-006**: System can efficiently delete all accounts and transactions (reset operation) in under 500ms for up to 1000 accounts and 10,000 transactions
- **SC-007**: All account and transaction identifiers are unique with zero collision probability (guaranteed by cuid algorithm)
- **SC-008**: Referential integrity between transactions and accounts is maintained (transactions cannot reference non-existent accounts)
- **SC-009**: Data model supports all required operations for Fase 2 user stories: account creation, balance query, deposits, withdrawals, and transfers

## Assumptions

- Account identifiers used in API endpoints (account_id) are the same as the internal database primary key (id using cuid) - no separate mapping field needed
- Balance values and transaction amounts are stored as Prisma Decimal type with precision @db.Decimal(10, 2) (10 total digits, 2 decimal places) to support precise financial calculations without floating-point errors
- Transaction amounts are always positive (direction is determined by transaction type and account role - origin or destination)
- System will handle concurrent transactions to the same account through application-level locking or database transactions
- Accounts can be created implicitly when first deposit occurs (as per US-007) or explicitly
- The reset functionality (US-004) will delete all accounts and transactions, which is acceptable for testing and development environments
- User association is optional to allow accounts to exist independently (for simpler API testing) but recommended for production security and audit
- Transaction history will be maintained permanently (no automatic cleanup) except through explicit reset operations
- The data model will be implemented using Prisma ORM with PostgreSQL database as per existing project structure
- All identifiers follow the cuid() generation policy as documented in the existing schema
- The Prisma model for bank accounts will be named `BankAccount` to avoid conflict with the existing `Account` model used for OAuth provider accounts

## Dependencies

- **Fase 1 (Autenticação)**: The data model should optionally associate accounts and transactions with authenticated users. This requires the User model to already exist in the schema.
- **Prisma Schema**: This feature modifies the existing Prisma schema, so it depends on the current schema structure and conventions (cuid policy, naming conventions, etc.)

## Out of Scope

- Implementation of business logic for operations (deposits, withdrawals, transfers) - this is handled by separate user stories
- API endpoint implementation - this is handled by separate user stories (US-005 through US-014)
- Validation rules for account creation or transaction processing - this is business logic handled by application layer
- Transaction locking or concurrency control implementation - this is handled at application/database transaction level
- Data migration scripts for existing data - this is a new feature with no existing data
- Data backup or archival strategies - this is infrastructure concern
- Account ownership or access control logic - this is business logic handled by application layer
- Audit logging beyond basic transaction tracking - detailed audit trails are out of scope
