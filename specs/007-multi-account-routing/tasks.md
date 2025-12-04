# Tasks: Multi-Account Management with Account Code Routing

**Input**: Design documents from `/specs/007-multi-account-routing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included as they were not explicitly requested in the feature specification.

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Dependencies

### User Story Completion Order

- **US1 (Account Code Generation)** → **Foundation** for all other stories
  - Must be completed before US2, US3, US4, US5
  - Provides unique account codes required for routing and selection

- **US2 (Account Code Routing)** → **Dependency** for US3, US4, US5
  - Enables URL-based account access
  - Required for sidebar selection (US3) to work properly

- **US3 (Account Selection)** → **Depends on** US1 and US2
  - Requires codes (US1) and routing (US2)
  - Enables account switching UI

- **US4 (Account-Specific Transaction History)** → **Depends on** US2 and US3
  - Requires routing to know which account is viewed
  - Uses account selection to filter transactions

- **US5 (Account-Specific Transactions)** → **Depends on** US2 and US3
  - Requires routing to know which account is active
  - Uses account selection to apply transactions to correct account

### Parallel Execution Opportunities

- **Backend tasks** can run in parallel with **Frontend tasks** after Phase 2
- **Service layer tasks** can run in parallel with **Handler tasks** within same story
- **Component tasks** can run in parallel with **Hook tasks** within same story
- **Database migration** must complete before any backend tasks that use the schema

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database migration, and shared infrastructure

- [x] T001 Update Prisma schema to add `code` field to BankAccount model in apps/backend/prisma/schema.prisma
- [x] T002 Add `@unique` constraint to `code` field in BankAccount model in apps/backend/prisma/schema.prisma
- [x] T003 Add `@@index([code])` for performance optimization in BankAccount model in apps/backend/prisma/schema.prisma
- [x] T004 Create and apply Prisma migration for account code field in apps/backend/prisma/migrations/
- [x] T005 Run Prisma generate to update Prisma Client in apps/backend/
- [x] T006 [P] Create account-code.service.ts for unique code generation in apps/backend/src/bank/services/account-code.service.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement generateAccountCode() function in apps/backend/src/bank/services/account-code.service.ts
- [x] T008 Implement generateUniqueAccountCode() function with retry logic in apps/backend/src/bank/services/account-code.service.ts
- [x] T009 Implement checkCodeExists() helper function in apps/backend/src/bank/services/account-code.service.ts
- [x] T010 Export account code service functions from apps/backend/src/bank/services/account-code.service.ts

**Checkpoint**: Foundation ready - account code generation service is complete. User story implementation can now begin.

---

## Phase 3: User Story 1 - Account Code Generation (Priority: P1) 🎯 MVP

**Goal**: As a system, I want to automatically generate a unique account code when a bank account is created, so that each account can be uniquely identified and accessed via a human-readable code.

**Independent Test**: Can be fully tested by creating a new bank account and verifying that a unique code in the format "XXXX-X" (4 digits, hyphen, 1 digit) is automatically generated and stored. This delivers immediate value by providing a unique identifier for each account.

**Acceptance Criteria**:

1. Account code automatically generated when bank account is created
2. Code format matches "XXXX-X" pattern (4 digits, hyphen, 1 digit)
3. Code is unique across all bank accounts in the system
4. Code is stored in database with account
5. Uniqueness maintained even under high concurrency

**Backend Implementation Tasks**:

- [x] T011 [US1] Update getOrCreateDefaultAccount() to generate and store account code in apps/backend/src/bank/services/account.service.ts
- [x] T012 [US1] Update deposit() method to generate code for new accounts in apps/backend/src/bank/services/account.service.ts
- [x] T013 [US1] Update AccountBalance interface to include code field in apps/backend/src/bank/services/account.service.ts
- [x] T014 [US1] Update getUserAccounts() to return account codes in apps/backend/src/bank/services/account.service.ts
- [x] T015 [US1] Add transaction wrapper for code generation to ensure atomicity in apps/backend/src/bank/services/account.service.ts
- [x] T016 [US1] Handle code generation retry logic in account creation in apps/backend/src/bank/services/account.service.ts
- [x] T017 [US1] Update accounts handler to include code in response in apps/backend/src/bank/handlers/accounts.ts
- [x] T018 [US1] Update accounts schema to include code field in response in apps/backend/src/bank/handlers/accounts.ts

**Checkpoint**: At this point, User Story 1 should be fully functional. All new bank accounts will have unique codes automatically generated and stored in the database.

---

## Phase 4: User Story 2 - Account Code Routing (Priority: P1)

**Goal**: As an authenticated user, I want to access a specific account using a URL with the account code (e.g., `/conta/1234-5`), so that I can view and manage that specific account directly via a shareable URL.

**Independent Test**: Can be fully tested by navigating to `/conta/1234-5` (where 1234-5 is a valid account code owned by the user) and verifying that the dashboard displays information for that specific account. This delivers immediate value by enabling direct account access.

**Acceptance Criteria**:

1. Route `/conta/[AccountCode]` accessible to authenticated users
2. Dashboard displays information for the account specified in URL
3. Invalid account codes show error message
4. Unauthorized account access shows error message
5. Unauthenticated users redirected to login

**Backend Implementation Tasks**:

- [x] T019 [US2] Create getAccountByCode() method in AccountService in apps/backend/src/bank/services/account.service.ts
- [x] T020 [US2] Create account-by-code.ts handler in apps/backend/src/bank/handlers/account-by-code.ts
- [x] T021 [US2] Implement account code format validation in apps/backend/src/bank/handlers/account-by-code.ts
- [x] T022 [US2] Implement account ownership validation in apps/backend/src/bank/handlers/account-by-code.ts
- [x] T023 [US2] Add account-by-code.ts schema definition in apps/backend/src/bank/handlers/account-by-code.ts
- [x] T024 [US2] Register GET /v1/accounts/:code route in apps/backend/src/bank/routes.ts
- [x] T025 [US2] Add authentication middleware to account-by-code route in apps/backend/src/bank/routes.ts
- [x] T026 [US2] Implement error handling for invalid code format in apps/backend/src/bank/handlers/account-by-code.ts
- [x] T027 [US2] Implement error handling for account not found in apps/backend/src/bank/handlers/account-by-code.ts
- [x] T028 [US2] Implement error handling for unauthorized access in apps/backend/src/bank/handlers/account-by-code.ts

**Frontend Implementation Tasks**:

- [x] T029 [US2] Add dynamic route configuration in apps/frontend/app/routes.ts for conta/:accountCode
- [x] T030 [US2] Create conta.$accountCode.tsx route component in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T031 [US2] Implement loader function with account code validation in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T032 [US2] Implement account code format validation regex in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T033 [US2] Add getAccountByCode() function to api.ts in apps/frontend/app/lib/api.ts
- [x] T034 [US2] Implement error handling for invalid account code format in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T035 [US2] Implement error handling for account not found in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T036 [US2] Implement redirect to login for unauthenticated users in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T037 [US2] Create use-account-by-code.ts hook in apps/frontend/app/hooks/use-account-by-code.ts
- [x] T038 [US2] Update dashboard.tsx to redirect to /conta/:accountCode for first account in apps/frontend/app/routes/dashboard.tsx
- [x] T039 [US2] Implement redirect logic for /conta/ without code to first account in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T040 [US2] Implement getFirstAccount() helper to find oldest account by createdAt in apps/frontend/app/hooks/use-accounts.ts

**Checkpoint**: At this point, User Story 2 should be fully functional. Users can access accounts via URL `/conta/[AccountCode]` and the dashboard displays the correct account information.

---

## Phase 5: User Story 3 - Account Selection in Sidebar (Priority: P1)

**Goal**: As an authenticated user, I want to select an account from a dropdown in the sidebar, so that I can quickly switch between my multiple bank accounts.

**Independent Test**: Can be fully tested by having multiple accounts, opening the sidebar dropdown, selecting a different account, and verifying that the URL changes to `/conta/[SelectedAccountCode]` and the dashboard updates to show the selected account's information. This delivers immediate value by enabling easy account switching.

**Acceptance Criteria**:

1. Sidebar displays dropdown with all user's accounts and codes
2. Selecting account updates URL to `/conta/[SelectedAccountCode]`
3. Dashboard updates to show selected account information
4. Sidebar dropdown reflects currently displayed account
5. Single account displays only code without dropdown
6. Creating second account automatically shows dropdown

**Frontend Implementation Tasks**:

- [x] T041 [US3] Update use-accounts.ts hook to fetch all user accounts with codes in apps/frontend/app/hooks/use-accounts.ts
- [x] T042 [US3] Update AccountBalance interface to include code field in apps/frontend/app/hooks/use-accounts.ts
- [x] T043 [US3] Update getAccounts() API function to include code in response in apps/frontend/app/lib/api.ts
- [x] T044 [US3] Update dashboard-sidebar.tsx to fetch and display accounts list in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T045 [US3] Implement account dropdown using Select component in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T046 [US3] Implement handleAccountChange() to update URL on selection in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T047 [US3] Implement useParams() to read accountCode from URL in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T048 [US3] Implement useNavigate() to update URL when account selected in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T049 [US3] Synchronize dropdown value with current URL accountCode in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T050 [US3] Implement conditional rendering: dropdown if multiple accounts, code only if single account in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T051 [US3] Display account codes in dropdown options in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T052 [US3] Handle empty accounts state with message and create option in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T053 [US3] Implement loading state for accounts list in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T054 [US3] Implement error handling for accounts list fetch failure in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T055 [US3] Prevent navigation when same account is selected in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx

**Checkpoint**: At this point, User Story 3 should be fully functional. Users can select accounts from sidebar dropdown, URL updates accordingly, and dashboard reflects the selected account.

---

## Phase 6: User Story 4 - Account-Specific Transaction History (Priority: P1)

**Goal**: As an authenticated user, I want to view transaction history filtered by the currently selected account, so that I can see only transactions relevant to that specific account.

**Independent Test**: Can be fully tested by selecting an account, viewing the transaction history, and verifying that only transactions for that specific account are displayed. This delivers immediate value by providing clear account-specific financial information.

**Acceptance Criteria**:

1. Transaction history shows only transactions for selected account
2. Includes deposits, withdrawals, and transfers involving the account
3. Transfers shown as single entry indicating sent/received
4. History updates when switching accounts
5. Empty state shown when account has no transactions

**Backend Implementation Tasks**:

- [x] T056 [US4] Update transactions handler to accept accountCode query parameter in apps/backend/src/bank/handlers/transactions.ts
- [x] T057 [US4] Implement account lookup by code in transactions handler in apps/backend/src/bank/handlers/transactions.ts
- [x] T058 [US4] Implement transaction filtering by account ID in transactions handler in apps/backend/src/bank/handlers/transactions.ts
- [x] T059 [US4] Add OR condition to filter by originAccountId OR destinationAccountId in apps/backend/src/bank/handlers/transactions.ts
- [x] T060 [US4] Update transactions schema to document accountCode query parameter in apps/backend/src/bank/handlers/transactions.ts
- [x] T061 [US4] Validate accountCode format and ownership in transactions handler in apps/backend/src/bank/handlers/transactions.ts

**Frontend Implementation Tasks**:

- [x] T062 [US4] Update use-transactions.ts hook to accept accountCode parameter in apps/frontend/app/hooks/use-transactions.ts
- [x] T063 [US4] Update getTransactions() API function to accept accountCode query parameter in apps/frontend/app/lib/api.ts
- [x] T064 [US4] Extract accountCode from URL params in conta.$accountCode.tsx route in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T065 [US4] Pass accountCode to use-transactions hook in conta route component in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T066 [US4] Update TransactionHistory component to handle account-specific filtering in apps/frontend/app/components/transaction-history.tsx
- [x] T067 [US4] Implement transfer transaction display logic (sent/received) in apps/frontend/app/components/transaction-history.tsx
- [x] T068 [US4] Update transaction history to show transfer direction relative to selected account in apps/frontend/app/components/transaction-history.tsx
- [x] T069 [US4] Add account code to transaction history query key for proper cache invalidation in apps/frontend/app/hooks/use-transactions.ts
- [x] T070 [US4] Update transaction history refresh when account changes in apps/frontend/app/routes/conta.$accountCode.tsx

**Checkpoint**: At this point, User Story 4 should be fully functional. Transaction history filters correctly by selected account and shows appropriate transfer indicators.

---

## Phase 7: User Story 5 - Account-Specific Deposit and Withdrawal (Priority: P1)

**Goal**: As an authenticated user, I want to perform deposits and withdrawals on the currently selected account, so that my transactions are applied to the correct account.

**Independent Test**: Can be fully tested by selecting an account, performing a deposit or withdrawal, and verifying that the transaction is recorded against that specific account and the account's balance updates correctly. This delivers immediate value by enabling proper multi-account financial management.

**Acceptance Criteria**:

1. Deposits applied to currently selected account
2. Withdrawals applied to currently selected account
3. Account balance updates correctly after transaction
4. Transaction history updates immediately after transaction
5. Only selected account balance changes, others unaffected

**Backend Implementation Tasks**:

- [x] T071 [US5] Update event handler to accept accountCode in request body in apps/backend/src/bank/handlers/event.ts
- [x] T072 [US5] Implement account lookup by code in event handler for deposit in apps/backend/src/bank/handlers/event.ts
- [x] T073 [US5] Implement account lookup by code in event handler for withdraw in apps/backend/src/bank/handlers/event.ts
- [x] T074 [US5] Validate accountCode format and ownership in event handler in apps/backend/src/bank/handlers/event.ts
- [x] T075 [US5] Fallback to default account if accountCode not provided for backward compatibility in apps/backend/src/bank/handlers/event.ts
- [x] T076 [US5] Update event schema to document accountCode as optional field in apps/backend/src/bank/handlers/event.ts
- [x] T077 [US5] Update deposit service method to accept account code in apps/backend/src/bank/services/account.service.ts
- [x] T078 [US5] Update withdraw service method to accept account code in apps/backend/src/bank/services/account.service.ts

**Frontend Implementation Tasks**:

- [x] T079 [US5] Extract accountCode from URL params in conta route in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T080 [US5] Update use-deposit.ts hook to accept accountCode parameter in apps/frontend/app/hooks/use-deposit.ts
- [x] T081 [US5] Update use-withdraw.ts hook to accept accountCode parameter in apps/frontend/app/hooks/use-withdraw.ts
- [x] T082 [US5] Update deposit() API function to include accountCode in request body in apps/frontend/app/lib/api.ts
- [x] T083 [US5] Update withdraw() API function to include accountCode in request body in apps/frontend/app/lib/api.ts
- [x] T084 [US5] Pass accountCode from URL to use-deposit hook in conta route in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T085 [US5] Pass accountCode from URL to use-withdraw hook in conta route in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T086 [US5] Update use-balance.ts hook to accept accountCode parameter in apps/frontend/app/hooks/use-balance.ts
- [x] T087 [US5] Update getBalance() API function to accept accountCode parameter in apps/frontend/app/lib/api.ts
- [x] T088 [US5] Update BalanceCard component to receive accountCode as prop in apps/frontend/app/components/balance-card.tsx
- [x] T089 [US5] Pass accountCode to BalanceCard from conta route in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T090 [US5] Update balance query key to include accountCode for proper cache invalidation in apps/frontend/app/hooks/use-balance.ts
- [x] T091 [US5] Update transaction history invalidation to include accountCode in apps/frontend/app/hooks/use-deposit.ts
- [x] T092 [US5] Update transaction history invalidation to include accountCode in apps/frontend/app/hooks/use-withdraw.ts

**Checkpoint**: At this point, User Story 5 should be fully functional. Deposits and withdrawals are correctly applied to the selected account, and balances update accordingly.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Integration, error handling improvements, and final polish

- [x] T093 Create backfill script for existing accounts without codes in apps/backend/scripts/backfill-account-codes.ts
- [x] T094 Update onboarding flow to redirect to /conta/:accountCode after account creation in apps/frontend/app/routes/onboarding.tsx
- [x] T095 Update dashboard route to redirect to first account automatically in apps/frontend/app/routes/dashboard.tsx
- [x] T096 Implement error boundary for invalid account codes in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T097 Add loading states for account switching in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T098 Implement optimistic updates for account selection in apps/frontend/app/components/dashboard/dashboard-sidebar.tsx
- [x] T099 Update balance card to show account code alongside balance in apps/frontend/app/components/balance-card.tsx
- [x] T100 Ensure all error messages are user-friendly and translated to Portuguese in apps/frontend/app/routes/conta.$accountCode.tsx
- [x] T101 Add account code validation helper function in apps/frontend/app/lib/validators.ts
- [x] T102 Update all API error handling to show appropriate messages for account-related errors in apps/frontend/app/lib/api.ts
- [x] T103 Verify backward compatibility: existing deposits/withdrawals without accountCode still work in apps/backend/src/bank/handlers/event.ts

---

## Implementation Strategy

### MVP Scope

**Phase 1 MVP**: User Story 1 (Account Code Generation) alone delivers immediate value by providing unique identifiers for all accounts. This can be deployed independently.

**Phase 2 MVP**: After US1, User Story 2 (Account Code Routing) enables direct account access via URL, providing bookmarkable links.

**Full Feature**: All 5 user stories work together to provide complete multi-account management experience.

### Incremental Delivery Plan

1. **Week 1**: Setup + US1 (Account Code Generation)
   - Database migration
   - Code generation service
   - All new accounts get codes

2. **Week 2**: US2 (Account Code Routing)
   - Backend endpoint for account by code
   - Frontend route configuration
   - URL-based account access

3. **Week 3**: US3 (Account Selection) + US4 (Transaction Filtering)
   - Sidebar dropdown
   - Transaction filtering by account

4. **Week 4**: US5 (Account-Specific Transactions) + Polish
   - Account-specific deposits/withdrawals
   - Integration testing
   - Final polish

### Testing Strategy

- **Unit Tests**: Account code generation service, validation helpers
- **Integration Tests**: Account creation with code, routing, API endpoints
- **E2E Tests**: Full flow from account creation to transaction on selected account

### Risk Mitigation

- **Database Migration**: Test migration on staging first, create rollback plan
- **Backward Compatibility**: Ensure existing accounts can be backfilled, existing API calls still work
- **Performance**: Monitor code generation under load, optimize queries with account code filter
