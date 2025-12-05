# Feature Specification: User Logout and Transaction History

**Feature Branch**: `006-logout-transactions`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "implementar 'logout do usuário' e 'Histórico de Transações'"

## Clarifications

### Session 2025-12-03

- Q: Quantas transações devem ser exibidas inicialmente no histórico? → A: 20 transações
- Q: Qual formato de data/hora deve ser exibido para as transações? → A: Data completa + hora (ex.: "03/12/2025 14:30")
- Q: Onde o botão de logout deve ser posicionado no dashboard? → A: Header/Topo da página - criar um header simples com o logo "LW Financial" e adicionar o ícone bank.svg ao lado, com o botão de logout
- Q: Em qual idioma os tipos de transação devem ser exibidos? → A: Português ("Depósito", "Saque", "Transferência")

## User Scenarios & Testing _(mandatory)_

### User Story 1 - User Logout (Priority: P1)

As an authenticated user, I want to have a logout button in the dashboard, so that I can securely end my session.

**Why this priority**: Logout is a fundamental security feature that allows users to protect their accounts when using shared devices or when they finish their session. This is a critical security requirement that should be available as soon as users can authenticate. Without logout functionality, users cannot securely end their sessions, leaving their accounts vulnerable.

**Independent Test**: Can be fully tested by navigating to the dashboard, clicking the logout button, and verifying that the session is terminated, the token is removed, and the user is redirected to the login page. This delivers immediate security value by allowing users to end their sessions independently.

**Acceptance Scenarios**:

1. **Given** I am logged into the dashboard, **When** I click the logout button, **Then** my JWT token is removed from storage, my session is invalidated, and I am redirected to the login page
2. **Given** I am logged into the dashboard, **When** I click the logout button, **Then** I cannot access protected routes without logging in again
3. **Given** I have performed a logout, **When** I try to access the dashboard directly, **Then** I am redirected to the login page because I am no longer authenticated
4. **Given** I am logged into the dashboard, **When** I click the logout button, **Then** all authentication state is cleared from the frontend

---

### User Story 2 - Transaction History Display (Priority: P2)

As an authenticated user, I want to view my recent transaction history on the dashboard, so that I can track my banking operations.

**Why this priority**: Transaction history provides users with visibility into their account activity, which is essential for financial management and security monitoring. While important, this feature depends on transactions existing (from deposits, withdrawals, and transfers), making it secondary to those core operations. This priority allows the core transaction operations to be established first.

**Independent Test**: Can be fully tested by navigating to the dashboard, viewing the transaction history section, and verifying that recent transactions are displayed with correct information (type, amount, date/time). This delivers value by enabling users to review their account activity independently.

**Acceptance Scenarios**:

1. **Given** I am logged into the dashboard and have performed transactions, **When** I view the transaction history section, **Then** I see a list of my recent transactions with type in Portuguese ("Depósito", "Saque", "Transferência"), amount, and date/time
2. **Given** I am logged into the dashboard, **When** I perform a new transaction (deposit, withdrawal, or transfer), **Then** the transaction history is automatically updated to show the new transaction
3. **Given** I am logged into the dashboard and have no transactions, **When** I view the transaction history section, **Then** I see an appropriate message indicating that there are no transactions yet
4. **Given** I am logged into the dashboard, **When** I view the transaction history, **Then** transactions are displayed in reverse chronological order (most recent first)
5. **Given** I am logged into the dashboard, **When** the transaction history fails to load, **Then** I see an appropriate error message

---

### Edge Cases

**Logout Edge Cases**:

- What happens if the user clicks logout while a transaction is in progress? (System MUST complete the logout process, canceling any pending operations)
- What happens if the token is already expired when the user clicks logout? (System MUST still clear the token and redirect to login)
- What happens if the logout button is clicked multiple times rapidly? (System MUST handle gracefully without errors)
- What happens if the user's session is invalidated on the server side while they are on the dashboard? (System MUST detect this and redirect to login on next API call)

**Transaction History Edge Cases**:

- What happens when there are more than 20 transactions? (System MUST display only the most recent 20 transactions, with no pagination or "load more" functionality in this version)
- What happens when a transaction has missing or invalid data? (System MUST display available data and handle missing fields gracefully)
- What happens when the transaction history API returns an error? (System MUST display user-friendly error message)
- What happens when the user has transactions from different time zones? (System MUST display dates/times in a consistent format: complete date + time, e.g., "03/12/2025 14:30")
- What happens when the transaction amount is very large or very small? (System MUST format currency values correctly)
- What happens when the transaction history is loading? (System MUST show loading indicator)
- What happens when the user performs multiple transactions in quick succession? (System MUST update the history correctly for all transactions)

## Requirements _(mandatory)_

### Functional Requirements

**Logout Requirements**:

- **FR-001**: System MUST provide a visible logout button on the dashboard. The logout button MUST be positioned in a header at the top of the page, which includes a simple header with the "LW Financial" logo and the bank.svg icon, with the logout button accessible from this header
- **FR-002**: System MUST remove the JWT token from client-side storage when logout is performed
- **FR-003**: System MUST clear all authentication state from the frontend when logout is performed
- **FR-004**: System MUST redirect the user to the login page after successful logout
- **FR-005**: System MUST invalidate the user's session on the frontend (prevent access to protected routes)
- **FR-006**: System MUST handle logout gracefully even if the token is already expired or invalid
- **FR-007**: System MUST prevent access to protected routes after logout without requiring a new login

**Transaction History Requirements**:

- **FR-008**: System MUST display a transaction history section on the dashboard
- **FR-009**: System MUST fetch transaction history from the backend API for the authenticated user
- **FR-010**: System MUST display transaction type in Portuguese for each transaction: "Depósito" (deposit), "Saque" (withdrawal), "Transferência" (transfer)
- **FR-011**: System MUST display transaction amount formatted as currency (Brazilian Real format: R$ 1.234,56) for each transaction
- **FR-012**: System MUST display transaction date and time for each transaction in the format: complete date + time (e.g., "03/12/2025 14:30")
- **FR-013**: System MUST display transactions in reverse chronological order (most recent first)
- **FR-014**: System MUST automatically update the transaction history after a new transaction is completed (deposit, withdrawal, or transfer)
- **FR-015**: System MUST display an appropriate message when there are no transactions to show
- **FR-016**: System MUST display a loading indicator while transaction history is being fetched
- **FR-017**: System MUST display user-friendly error messages when transaction history fails to load
- **FR-018**: System MUST include authentication credentials (JWT token) in all transaction history API requests
- **FR-019**: System MUST handle API errors (400, 401, 403, 404, 500) and display appropriate error messages
- **FR-020**: System MUST limit the number of transactions displayed initially to the most recent 20 transactions

### Key Entities _(include if feature involves data)_

- **Transaction**: Represents a banking operation (deposit, withdrawal, or transfer), containing:
  - Transaction type (DEPOSIT, WITHDRAW, TRANSFER)
  - Transaction amount (decimal with 2 decimal places)
  - Transaction date and time (timestamp)
  - Origin account ID (for withdrawals and transfers)
  - Destination account ID (for deposits and transfers)
  - User ID (for associating transactions with users)

- **User Session**: Represents the authenticated user session, containing:
  - JWT token (stored in client-side storage)
  - Authentication state (authenticated/not authenticated)
  - User account information

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete logout in under 2 seconds from clicking the button to being redirected to the login page
- **SC-002**: 100% of logout attempts successfully remove the token and redirect to login
- **SC-003**: Users cannot access protected routes after logout without logging in again
- **SC-004**: Transaction history loads and displays within 2 seconds for users with up to 20 transactions
- **SC-005**: Transaction history updates within 1 second after a new transaction is completed
- **SC-006**: 95% of transaction history requests with valid authentication result in successful data retrieval
- **SC-007**: Users can view their transaction history without assistance in 90% of cases
- **SC-008**: Transaction history displays correctly formatted currency values for 100% of transactions
- **SC-009**: Transaction history displays correctly formatted dates and times for 100% of transactions

## Assumptions

- Users are already authenticated and have access to the dashboard (authentication is handled by US-015 and US-016)
- The dashboard exists and displays account balance (from US-016)
- Transactions are already being created in the database when deposits, withdrawals, and transfers are performed (from Fase 2)
- The backend has a Transaction model with the necessary fields (type, amount, createdAt, userId, etc.)
- A backend API endpoint exists or will be created to retrieve transaction history for the authenticated user
- Currency is Brazilian Real (BRL) with standard formatting
- The JWT token is stored in client-side storage (as per existing authentication implementation)
- Logout functionality is available in the authentication system
- Network connectivity is available for API communication
- Users have performed at least one transaction before viewing transaction history (or the system handles empty state gracefully)

## Dependencies

- **US-015**: Tela de Login - Users must be authenticated to access the dashboard and perform logout
- **US-016**: Dashboard - Visualização de Saldo - The dashboard must exist as the location for logout button and transaction history
- **US-017**: Dashboard - Realizar Depósito - Deposits create transactions that appear in history
- **US-018**: Dashboard - Realizar Saque - Withdrawals create transactions that appear in history
- **US-019**: Dashboard - Realizar Transferência - Transfers create transactions that appear in history
- **Fase 2**: Backend Transaction model and creation logic must be implemented
- **Backend API**: Transaction history endpoint must be available (may need to be created as part of this feature)

## Out of Scope

- Server-side session invalidation (logout only clears frontend token)
- Transaction history pagination beyond the initial 20 transactions (e.g., "load more" functionality)
- Transaction filtering or search functionality
- Transaction export or download functionality
- Transaction details view (clicking on a transaction to see more details)
- Transaction categories or tags
- Transaction notes or descriptions
- Email notifications for transactions
- Real-time transaction updates via WebSocket (updates happen on next page refresh or after new transaction)
