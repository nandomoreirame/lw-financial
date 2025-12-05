# Feature Specification: Dashboard Deposit and Withdraw Operations

**Feature Branch**: `005-deposit-withdraw`
**Created**: 2025-12-02
**Status**: Draft
**Input**: User description: "Dashboard deposit and withdraw operations"

## Clarifications

### Session 2025-12-02

- Q: Como o frontend deve identificar qual ID de conta usar nas requisições de depósito e saque? → A: Backend identifica automaticamente a conta padrão do usuário autenticado (sem precisar enviar accountId no frontend)
- Q: Que tipo de feedback visual o usuário deve ver enquanto uma transação está sendo processada? → A: Botão desabilitado com spinner/loading + mensagem "Processando..."
- Q: Quais são os limites mínimos e máximos de valor para depósitos e saques, e quantas casas decimais são permitidas? → A: Mínimo: R$ 0,01 | Máximo: R$ 999.999,99 | Decimais: 2 casas

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Deposit Money (Priority: P1)

As an authenticated user, I want to deposit money into my account through the dashboard, so that I can add funds to my balance.

**Why this priority**: Deposits are fundamental banking operations that enable users to fund their accounts. This is a core feature that must be available before users can perform other operations like withdrawals or transfers. Without deposits, the account balance would remain static.

**Independent Test**: Can be fully tested by navigating to the dashboard, entering a deposit amount, submitting the form, and verifying that the balance updates correctly. This delivers immediate value by allowing users to add funds to their account independently of any other feature.

**Acceptance Scenarios**:

1. **Given** I am logged into the dashboard and my current balance is displayed, **When** I enter a valid deposit amount and click the deposit button, **Then** the deposit is processed successfully, my balance is updated, and I see a success message
2. **Given** I am on the deposit form, **When** I enter an invalid amount (negative, zero, or non-numeric), **Then** I see a validation error message and the deposit is not submitted
3. **Given** I submit a deposit, **When** the server returns an error, **Then** I see an appropriate error message and my balance remains unchanged
4. **Given** I successfully complete a deposit, **When** I view my balance, **Then** the new balance reflects the deposited amount

---

### User Story 2 - Withdraw Money (Priority: P2)

As an authenticated user, I want to withdraw money from my account through the dashboard, so that I can access my funds.

**Why this priority**: Withdrawals are essential for users to access their funds, but they depend on having funds available (from deposits). While important, withdrawals are secondary to deposits since users must first deposit money before they can withdraw it. This priority allows the deposit flow to be established first.

**Independent Test**: Can be fully tested by navigating to the dashboard, entering a withdrawal amount that does not exceed the current balance, submitting the form, and verifying that the balance decreases correctly. This delivers value by enabling users to access their funds independently.

**Acceptance Scenarios**:

1. **Given** I am logged into the dashboard with a positive balance, **When** I enter a valid withdrawal amount that does not exceed my balance and click the withdraw button, **Then** the withdrawal is processed successfully, my balance is updated, and I see a success message
2. **Given** I am on the withdraw form, **When** I enter an amount greater than my current balance, **Then** I see an insufficient funds error message and the withdrawal is not processed
3. **Given** I am on the withdraw form, **When** I enter an invalid amount (negative, zero, or non-numeric), **Then** I see a validation error message and the withdrawal is not submitted
4. **Given** I submit a withdrawal, **When** the server returns an error, **Then** I see an appropriate error message and my balance remains unchanged
5. **Given** I successfully complete a withdrawal, **When** I view my balance, **Then** the new balance reflects the withdrawn amount

---

### Edge Cases

- What happens when the user tries to deposit or withdraw an amount exceeding R$ 999.999,99? (System MUST reject with validation error)
- What happens when the user tries to deposit or withdraw an amount below R$ 0,01? (System MUST reject with validation error)
- What happens when the user enters a value with more than 2 decimal places? (System MUST reject or round to 2 decimal places)
- What happens when the user tries to withdraw when the account balance is zero? (System MUST show insufficient funds error)
- How does the system handle network timeouts during deposit or withdrawal operations? (System MUST display timeout error and allow retry)
- What happens if the user submits a form while another transaction is in progress? (System MUST prevent duplicate submission - button disabled)
- How does the system handle concurrent deposits or withdrawals from the same account? (Backend MUST handle concurrency - frontend prevents duplicate requests)
- What happens if the authentication token expires during a transaction? (System MUST return 401 error and redirect to login)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a deposit form on the dashboard with an input field for the deposit amount
- **FR-002**: System MUST provide a withdraw form on the dashboard with an input field for the withdrawal amount
- **FR-003**: System MUST validate that deposit amounts are positive numbers greater than zero, with minimum value of R$ 0,01, maximum value of R$ 999.999,99, and exactly 2 decimal places
- **FR-004**: System MUST validate that withdrawal amounts are positive numbers greater than zero, with minimum value of R$ 0,01, maximum value of R$ 999.999,99, and exactly 2 decimal places
- **FR-005**: System MUST prevent withdrawals when the requested amount exceeds the current account balance
- **FR-006**: System MUST send deposit requests to the backend API endpoint `/v1/event` with type "deposit" and the amount. The backend MUST automatically identify the authenticated user's default account (no accountId needs to be sent from frontend)
- **FR-007**: System MUST send withdrawal requests to the backend API endpoint `/v1/event` with type "withdraw" and the amount. The backend MUST automatically identify the authenticated user's default account (no accountId needs to be sent from frontend)
- **FR-008**: System MUST update the displayed account balance immediately after a successful deposit or withdrawal
- **FR-009**: System MUST display a success message to the user after a successful deposit or withdrawal operation
- **FR-010**: System MUST display appropriate error messages when deposit or withdrawal operations fail
- **FR-011**: System MUST disable the deposit and withdraw buttons while a transaction is in progress to prevent duplicate submissions. The button MUST display a loading spinner/indicator and show a "Processando..." message to provide visual feedback to the user
- **FR-012**: System MUST include authentication credentials (JWT token) in all deposit and withdrawal API requests
- **FR-013**: System MUST handle API errors (400, 401, 403, 404, 500) and display user-friendly error messages
- **FR-014**: System MUST format currency values consistently (e.g., Brazilian Real format: R$ 1.234,56)
- **FR-015**: System MUST clear the input field after a successful deposit or withdrawal operation

### Key Entities _(include if feature involves data)_

- **Deposit Transaction**: Represents a money deposit operation, containing the deposit amount and timestamp
- **Withdrawal Transaction**: Represents a money withdrawal operation, containing the withdrawal amount and timestamp
- **Account Balance**: The current available balance in the user's account, updated after each transaction

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete a deposit operation in under 5 seconds from entering the amount to seeing the updated balance
- **SC-002**: Users can complete a withdrawal operation in under 5 seconds from entering the amount to seeing the updated balance
- **SC-003**: 95% of deposit attempts with valid amounts result in successful transactions
- **SC-004**: 95% of withdrawal attempts with sufficient balance result in successful transactions
- **SC-005**: Users receive error feedback within 2 seconds when validation fails (invalid amounts, insufficient funds)
- **SC-006**: The balance display updates within 1 second after a successful transaction
- **SC-007**: 90% of users successfully complete their first deposit without assistance
- **SC-008**: 90% of users successfully complete their first withdrawal without assistance when they have sufficient balance

## Assumptions

- Users are already authenticated and have access to the dashboard (authentication is handled by US-015 and US-016)
- The backend API endpoint `/v1/event` is already implemented and functional (from Fase 2)
- The account balance is displayed on the dashboard (from US-016)
- Currency is Brazilian Real (BRL) with standard formatting
- There are no transaction fees for deposits or withdrawals
- The system supports standard numeric precision for currency (2 decimal places)
- Network connectivity is available for API communication
- The JWT token is stored in sessionStorage (as per existing authentication implementation)

## Dependencies

- **US-015**: Tela de Login - Users must be authenticated to access the dashboard
- **US-016**: Dashboard - Visualização de Saldo - The dashboard must exist and display the current balance
- **Fase 2**: Backend endpoints for `/v1/event` with types "deposit" and "withdraw" must be implemented
- **US-022**: Mensagens de Erro - Error handling and display mechanisms should be considered (can be implemented in parallel)

## Out of Scope

- Transfer operations between accounts (covered by US-019)
- Transaction history display (covered by US-020)
- Multiple currency support
- Scheduled or recurring deposits/withdrawals
- Transaction limits or daily limits configuration
- Fee calculation or display
- Receipt generation or printing
- Email notifications for transactions
