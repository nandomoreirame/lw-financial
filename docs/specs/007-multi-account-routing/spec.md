# Feature Specification: Multi-Account Management with Account Code Routing

**Feature Branch**: `007-multi-account-routing`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "alterar a relação de user com bankaccount, onde 1 usuário pode ter n contas bancárias, adicione também um código, deve ser único e gerado aumaticamente no momento da criação da conta, deve ter 4 dígitos e um prefixo como número da conta, exemplo: 1234-5 - ao criar uma banckaccount anexar a conta ao user, a rota customizada para cada conta do usuário deve ser /conta/[BankAccountCode] exemplo: /conta/1234-5 - quando ele selecionar uma conta no select na sidebar deve alterar o código na url e exibir o extrato apenas da conta selecionada, e ao depositar e sacar ele deve inserir o saque e depósitos na conta selecionada."

## Clarifications

### Session 2025-12-03

- Q: When a user navigates to `/conta/` without an account code or when no account is selected, what should be the default behavior? → A: Redirect automatically to the user's first account (oldest account by creation timestamp) - if user has no accounts, show error with option to create account
- Q: When a transfer transaction involves two accounts owned by the same user, how should it appear in the transaction history of the currently viewed account? → A: Show as a single entry in the currently viewed account's history, indicating whether it's a sent or received transfer with details about the other account
- Q: When a user has only one bank account, how should it appear in the sidebar? → A: Show only the account code without dropdown when user has only one account; automatically show dropdown when user creates a second account
- Q: When the system redirects to the user's "first account" or "default account", what criteria determines which account is selected? → A: The account created first (oldest account by creation timestamp)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Account Code Generation (Priority: P1)

As a system, I want to automatically generate a unique account code when a bank account is created, so that each account can be uniquely identified and accessed via a human-readable code.

**Why this priority**: Account codes are fundamental identifiers that enable routing and account selection. Without unique codes, users cannot distinguish between multiple accounts or access specific accounts via URLs. This is a foundational requirement that must be in place before any routing or selection features can work.

**Independent Test**: Can be fully tested by creating a new bank account and verifying that a unique code in the format "XXXX-X" (4 digits, hyphen, 1 digit) is automatically generated and stored. This delivers immediate value by providing a unique identifier for each account.

**Acceptance Scenarios**:

1. **Given** a new bank account is being created, **When** the account is saved to the database, **Then** a unique account code is automatically generated in the format "XXXX-X" (4 digits, hyphen, 1 digit) and stored with the account
2. **Given** multiple bank accounts are created, **When** account codes are generated, **Then** each account receives a unique code that does not conflict with existing codes
3. **Given** a bank account already exists with a code, **When** a new account code is generated, **Then** the system ensures no duplicate codes are created
4. **Given** a bank account is created, **When** the account code is generated, **Then** the code format matches the pattern exactly (4 digits, hyphen, 1 digit)

---

### User Story 2 - Account Code Routing (Priority: P1)

As an authenticated user, I want to access a specific account using a URL with the account code (e.g., `/conta/1234-5`), so that I can view and manage that specific account directly via a shareable URL.

**Why this priority**: URL-based routing enables direct access to specific accounts, improves user experience through bookmarkable URLs, and allows for better navigation. This is essential for the multi-account workflow where users need to switch between accounts. Without routing, users cannot access specific accounts directly.

**Independent Test**: Can be fully tested by navigating to `/conta/1234-5` (where 1234-5 is a valid account code owned by the user) and verifying that the dashboard displays information for that specific account. This delivers immediate value by enabling direct account access.

**Acceptance Scenarios**:

1. **Given** I am authenticated and have multiple bank accounts, **When** I navigate to `/conta/[AccountCode]` where AccountCode belongs to one of my accounts, **Then** the dashboard displays information for that specific account
2. **Given** I am authenticated, **When** I navigate to `/conta/[AccountCode]` where AccountCode does not belong to me, **Then** I am shown an error message indicating I don't have access to that account
3. **Given** I am authenticated, **When** I navigate to `/conta/[AccountCode]` where AccountCode does not exist, **Then** I am shown an error message indicating the account was not found
4. **Given** I am not authenticated, **When** I navigate to `/conta/[AccountCode]`, **Then** I am redirected to the login page
5. **Given** I am authenticated and viewing an account via `/conta/[AccountCode]`, **When** I refresh the page, **Then** the same account continues to be displayed

---

### User Story 3 - Account Selection in Sidebar (Priority: P1)

As an authenticated user, I want to select an account from a dropdown in the sidebar, so that I can quickly switch between my multiple bank accounts.

**Why this priority**: Account selection is the primary mechanism for users to navigate between multiple accounts. Without this, users cannot effectively manage multiple accounts. This feature depends on account codes (US1) and routing (US2), making it P1 but dependent on those.

**Independent Test**: Can be fully tested by having multiple accounts, opening the sidebar dropdown, selecting a different account, and verifying that the URL changes to `/conta/[SelectedAccountCode]` and the dashboard updates to show the selected account's information. This delivers immediate value by enabling easy account switching.

**Acceptance Scenarios**:

1. **Given** I am authenticated and have multiple bank accounts, **When** I view the sidebar, **Then** I see a dropdown displaying all my bank accounts with their account codes
2. **Given** I am viewing one account, **When** I select a different account from the sidebar dropdown, **Then** the URL changes to `/conta/[SelectedAccountCode]` and the dashboard updates to display the selected account's information
3. **Given** I have selected an account in the sidebar, **When** I navigate to a different account URL directly, **Then** the sidebar dropdown reflects the currently displayed account
4. **Given** I have only one bank account, **When** I view the sidebar, **Then** only the account code is displayed without a dropdown
5. **Given** I have only one bank account, **When** I create a second account, **Then** the sidebar automatically shows a dropdown with both accounts
6. **Given** I am viewing an account, **When** I select the same account from the dropdown, **Then** no navigation occurs and the current view remains unchanged

---

### User Story 4 - Account-Specific Transaction History (Priority: P1)

As an authenticated user, I want to view transaction history filtered by the currently selected account, so that I can see only transactions relevant to that specific account.

**Why this priority**: Transaction history filtering is essential for multi-account users. Without filtering, users would see mixed transactions from all accounts, making it impossible to understand individual account activity. This depends on account routing (US2) and selection (US3).

**Independent Test**: Can be fully tested by selecting an account, viewing the transaction history, and verifying that only transactions for that specific account are displayed. This delivers immediate value by providing clear account-specific financial information.

**Acceptance Scenarios**:

1. **Given** I am viewing a specific account via `/conta/[AccountCode]`, **When** I view the transaction history section, **Then** I see only transactions associated with that account (deposits to, withdrawals from, transfers to/from that account)
2. **Given** I have transactions in multiple accounts, **When** I switch between accounts using the sidebar, **Then** the transaction history updates to show only transactions for the newly selected account
3. **Given** I am viewing an account with no transactions, **When** I view the transaction history section, **Then** I see an appropriate message indicating there are no transactions for that account
4. **Given** I am viewing an account, **When** I perform a new transaction (deposit, withdrawal, or transfer involving that account), **Then** the transaction history automatically updates to include the new transaction
5. **Given** I am viewing an account's transaction history, **When** the history loads, **Then** transactions are displayed in reverse chronological order (most recent first)

---

### User Story 5 - Account-Specific Deposit and Withdrawal (Priority: P1)

As an authenticated user, I want to perform deposits and withdrawals on the currently selected account, so that my transactions are applied to the correct account.

**Why this priority**: Account-specific transactions are essential for multi-account functionality. Without this, users cannot effectively manage multiple accounts, as all operations would default to an undefined or incorrect account. This depends on account routing (US2) and selection (US3).

**Independent Test**: Can be fully tested by selecting an account, performing a deposit or withdrawal, and verifying that the transaction is recorded against that specific account and the account's balance updates correctly. This delivers immediate value by enabling proper multi-account financial management.

**Acceptance Scenarios**:

1. **Given** I am viewing a specific account via `/conta/[AccountCode]`, **When** I perform a deposit, **Then** the deposit is recorded against that account and the account's balance increases accordingly
2. **Given** I am viewing a specific account via `/conta/[AccountCode]`, **When** I perform a withdrawal, **Then** the withdrawal is recorded against that account and the account's balance decreases accordingly
3. **Given** I have selected an account, **When** I perform a deposit or withdrawal, **Then** the transaction history for that account is automatically updated to show the new transaction
4. **Given** I have multiple accounts with different balances, **When** I perform a transaction on one account, **Then** only that account's balance changes and other accounts remain unaffected
5. **Given** I perform a transaction on a selected account, **When** I switch to a different account, **Then** the transaction does not appear in the other account's history

---

### Edge Cases

**Account Code Generation Edge Cases**:

- What happens if a generated code already exists? (System MUST generate a new unique code and retry until a unique code is found)
- What happens during high concurrency when multiple accounts are created simultaneously? (System MUST ensure code uniqueness using database constraints or locking mechanisms)
- What happens if account creation fails after code generation? (System MUST handle rollback properly, and the code should not be considered "used" if account creation fails)
- What happens if the code generation algorithm exhausts all possible codes? (System MUST handle this gracefully, though it's unlikely with the format specified)

**Account Routing Edge Cases**:

- What happens if a user navigates to `/conta/` without a code? (System MUST redirect automatically to the user's first account, defined as the account created first (oldest by creation timestamp); if user has no accounts, show error message with option to create account)
- What happens if the account code in the URL has invalid format? (System MUST show an error message indicating invalid format)
- What happens if the user's session expires while viewing an account? (System MUST redirect to login page)
- What happens if an account is deleted while a user is viewing it? (System MUST show an error message and redirect to the user's first account (oldest by creation timestamp) or account list if no accounts remain)

**Account Selection Edge Cases**:

- What happens if a user has no accounts? (System MUST show an appropriate message and provide option to create an account)
- What happens if the account list fails to load? (System MUST show an error message)
- What happens if the selected account is deleted while the dropdown is open? (System MUST handle gracefully, possibly by removing it from the list and redirecting)
- What happens if a user selects an account they no longer own? (System MUST validate ownership and show error if access is denied)

**Transaction History Filtering Edge Cases**:

- What happens when filtering by account returns no transactions? (System MUST display appropriate empty state message)
- What happens when transaction history API fails for a specific account? (System MUST display user-friendly error message)
- What happens when a transaction involves multiple accounts (transfer)? (System MUST show the transaction as a single entry in the currently viewed account's history, indicating whether it's a sent or received transfer with details about the other account)
- What happens when transaction history is loading for a selected account? (System MUST show loading indicator)

**Account-Specific Transactions Edge Cases**:

- What happens if a user tries to withdraw more than the account balance? (System MUST prevent withdrawal and show appropriate error message - this should already be handled by existing validation)
- What happens if a deposit fails due to validation errors? (System MUST show error message and not update balance)
- What happens if the account becomes unavailable during a transaction? (System MUST handle gracefully and show error message)
- What happens if multiple transactions are attempted simultaneously on the same account? (System MUST handle concurrency properly, ensuring balance accuracy)

## Requirements _(mandatory)_

### Functional Requirements

**Account Code Requirements**:

- **FR-001**: System MUST automatically generate a unique account code when a bank account is created
- **FR-002**: Account code MUST follow the format: 4 digits, hyphen, 1 digit (e.g., "1234-5")
- **FR-003**: Account code MUST be unique across all bank accounts in the system
- **FR-004**: Account code MUST be stored in the database as part of the BankAccount entity
- **FR-005**: Account code MUST be generated automatically without user input during account creation
- **FR-006**: System MUST ensure code uniqueness even under high concurrency conditions
- **FR-007**: Account code MUST be immutable once created (cannot be changed after account creation)

**Account Routing Requirements**:

- **FR-008**: System MUST support URL routing to individual accounts using the pattern `/conta/[AccountCode]`
- **FR-008a**: System MUST redirect to the user's first account when accessing `/conta/` without an account code, where "first account" is defined as the account created first (oldest account by creation timestamp); if user has no accounts, System MUST show error message with option to create account
- **FR-009**: System MUST validate that the account code in the URL belongs to the authenticated user before displaying account information
- **FR-010**: System MUST redirect unauthenticated users to login page when accessing `/conta/[AccountCode]`
- **FR-011**: System MUST display error message when account code in URL does not exist
- **FR-012**: System MUST display error message when account code in URL belongs to a different user
- **FR-013**: System MUST validate account code format in URL (4 digits, hyphen, 1 digit)
- **FR-014**: System MUST handle invalid account code formats in URL gracefully with appropriate error message
- **FR-015**: When a user navigates to `/conta/[AccountCode]`, System MUST display dashboard information for that specific account

**Account Selection Requirements**:

- **FR-016**: System MUST display a dropdown in the sidebar listing all bank accounts belonging to the authenticated user
- **FR-017**: System MUST display account codes in the sidebar dropdown for account identification
- **FR-018**: System MUST update the URL to `/conta/[SelectedAccountCode]` when a user selects an account from the sidebar dropdown
- **FR-019**: System MUST update the dashboard to display the selected account's information when an account is selected from the sidebar
- **FR-020**: System MUST reflect the currently displayed account in the sidebar dropdown (selected state)
- **FR-021**: System MUST synchronize sidebar selection with the current URL (if URL changes, sidebar updates)
- **FR-022**: System MUST display only the account code without dropdown when the user has only one account
- **FR-022a**: System MUST automatically show dropdown when the user creates a second account
- **FR-023**: System MUST fetch and display all user accounts in the sidebar dropdown

**Transaction History Filtering Requirements**:

- **FR-024**: System MUST filter transaction history to show only transactions for the currently selected/viewed account
- **FR-025**: System MUST include deposits made to the selected account in the filtered transaction history
- **FR-026**: System MUST include withdrawals made from the selected account in the filtered transaction history
- **FR-027**: System MUST include transfers where the selected account is the origin or destination in the filtered transaction history
- **FR-027a**: System MUST display transfer transactions as a single entry in the currently viewed account's history, indicating whether it's a sent transfer (account is origin) or received transfer (account is destination), with details about the other account involved
- **FR-028**: System MUST update transaction history when the user switches between accounts
- **FR-029**: System MUST display appropriate empty state message when the selected account has no transactions
- **FR-030**: System MUST display transaction history in reverse chronological order (most recent first) for the selected account
- **FR-031**: System MUST include the account code in API requests for transaction history to filter correctly

**Account-Specific Transaction Requirements**:

- **FR-032**: System MUST apply deposits to the currently selected/viewed account when a deposit is performed
- **FR-033**: System MUST apply withdrawals to the currently selected/viewed account when a withdrawal is performed
- **FR-034**: System MUST include the account code (or account ID) in deposit API requests to ensure the transaction is recorded against the correct account
- **FR-035**: System MUST include the account code (or account ID) in withdrawal API requests to ensure the transaction is recorded against the correct account
- **FR-036**: System MUST update the selected account's balance immediately after a successful deposit or withdrawal
- **FR-037**: System MUST update the transaction history for the selected account immediately after a successful deposit or withdrawal
- **FR-038**: System MUST validate that the account exists and belongs to the user before processing deposits or withdrawals
- **FR-039**: System MUST prevent transactions on accounts that the user does not own

**User-Account Relationship Requirements**:

- **FR-040**: System MUST support a one-to-many relationship where one user can have multiple bank accounts
- **FR-041**: System MUST ensure that when a bank account is created, it is automatically associated with the authenticated user
- **FR-042**: System MUST ensure that all bank accounts are properly linked to a user (no orphaned accounts)

### Key Entities _(include if feature involves data)_

- **BankAccount**: Represents a bank account belonging to a user, containing:
  - Account ID (unique identifier)
  - Account Code (unique human-readable code in format "XXXX-X")
  - Balance (decimal with 2 decimal places)
  - User ID (foreign key linking to User)
  - Creation timestamp
  - Update timestamp

- **User**: Represents an authenticated user who can own multiple bank accounts, containing:
  - User ID (unique identifier)
  - Authentication information
  - Relationship to multiple BankAccount entities (one-to-many)

- **Transaction**: Represents a banking operation, containing:
  - Transaction ID (unique identifier)
  - Transaction type (DEPOSIT, WITHDRAW, TRANSFER)
  - Amount (decimal with 2 decimal places)
  - Origin Account ID (for withdrawals and transfers)
  - Destination Account ID (for deposits and transfers)
  - User ID (for user association)
  - Creation timestamp

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Account codes are generated and stored successfully for 100% of new bank account creations
- **SC-002**: All generated account codes follow the specified format (4 digits, hyphen, 1 digit) with 100% accuracy
- **SC-003**: Account code uniqueness is maintained with 100% success rate (no duplicate codes generated)
- **SC-004**: Users can navigate to a specific account via `/conta/[AccountCode]` URL within 2 seconds of page load
- **SC-005**: Account selection in sidebar updates the URL and dashboard view within 1 second of selection
- **SC-006**: Transaction history filters correctly to show only the selected account's transactions in 100% of cases
- **SC-007**: Deposits and withdrawals are correctly applied to the selected account in 100% of transactions
- **SC-008**: Users can successfully switch between multiple accounts using the sidebar dropdown in 95% of attempts
- **SC-009**: Account routing validates user ownership and prevents unauthorized access in 100% of access attempts
- **SC-010**: Transaction history updates within 1 second after a new transaction is completed on the selected account

## Assumptions

- Users can already authenticate and access the dashboard (authentication functionality exists from previous features)
- The system already supports one user having multiple bank accounts at the database level (schema supports this relationship)
- Account creation functionality exists (onboarding or account creation flow)
- Transaction history API exists or will be extended to support filtering by account code/ID
- Deposit and withdrawal APIs exist or will be extended to accept account code/ID parameter
- The frontend routing system (React Router) supports dynamic route parameters like `/conta/[AccountCode]`
- Account codes are URL-safe (the format "XXXX-X" is URL-safe)
- Users will have at least one bank account before accessing account selection features
- The sidebar component exists and can be extended with account selection dropdown
- Database transactions ensure data consistency when generating unique codes
- The account code format allows for sufficient unique combinations to avoid collisions

## Dependencies

- **Authentication System**: Users must be authenticated to access account-specific routes and perform transactions
- **Bank Account Creation**: Account creation flow must exist to trigger account code generation
- **Dashboard**: Dashboard must exist as the destination for account routing
- **Transaction History API**: Must support filtering by account ID/code
- **Deposit/Withdrawal APIs**: Must support account ID/code parameter to specify target account
- **Database Schema**: BankAccount model must support account code field and user relationship
- **Frontend Routing**: React Router must support dynamic routes with account code parameter

## Out of Scope

- Account code editing or changing after creation (codes are immutable)
- Account deletion functionality (handled separately)
- Account renaming or custom account names (only codes are used for identification)
- Account sharing between users (each account belongs to one user)
- Account code format customization (format is fixed as "XXXX-X")
- Account code generation algorithm details (implementation-specific, not part of spec)
- Bulk account operations (creating multiple accounts at once)
- Account code search or lookup by partial code
- Account statistics or analytics per account (beyond transaction history)
- Account code validation API endpoints (validation happens internally)
- Account switching via keyboard shortcuts (only dropdown selection)
- Account code in QR codes or other formats (only URL format)
- Account code history or audit trail (only current code matters)
