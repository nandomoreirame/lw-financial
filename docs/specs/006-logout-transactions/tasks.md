# Tasks: User Logout and Transaction History

**Input**: Design documents from `/specs/006-logout-transactions/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included as they were not explicitly requested in the feature specification.

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared utility functions

- [x] T001 [P] Create format-date.ts utility function in apps/frontend/app/lib/format-date.ts
- [x] T002 [P] Create transaction-types.ts utility function in apps/frontend/app/lib/transaction-types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add Transaction interface to apps/frontend/app/lib/api.ts
- [x] T004 Add TransactionsResponse interface to apps/frontend/app/lib/api.ts
- [x] T005 Add getTransactions() function to apps/frontend/app/lib/api.ts
- [x] T006 Create use-transactions.ts hook in apps/frontend/app/hooks/use-transactions.ts

---

## Phase 3: User Story 1 - User Logout (Priority: P1)

**Goal**: As an authenticated user, I want to have a logout button in the dashboard, so that I can securely end my session.

**Independent Test**: Can be fully tested by navigating to the dashboard, clicking the logout button, and verifying that the session is terminated, the token is removed, and the user is redirected to the login page.

**Acceptance Criteria**:

1. Logout button visible in header
2. Clicking logout removes JWT token from sessionStorage
3. Clicking logout clears all authentication state
4. Clicking logout redirects to login page
5. After logout, protected routes are inaccessible without new login

**Implementation Tasks**:

- [x] T007 [US1] Create Header component in apps/frontend/app/components/dashboard/header.tsx
- [x] T008 [US1] Import Header component in apps/frontend/app/routes/dashboard.tsx
- [x] T009 [US1] Add Header to dashboard layout in apps/frontend/app/routes/dashboard.tsx

---

## Phase 4: User Story 2 - Transaction History Display (Priority: P2)

**Goal**: As an authenticated user, I want to view my recent transaction history on the dashboard, so that I can track my banking operations.

**Independent Test**: Can be fully tested by navigating to the dashboard, viewing the transaction history section, and verifying that recent transactions are displayed with correct information (type, amount, date/time).

**Acceptance Criteria**:

1. Transaction history section displayed on dashboard
2. Shows list of recent transactions (up to 20)
3. Displays transaction type in Portuguese ("Depósito", "Saque", "Transferência")
4. Displays transaction amount formatted as currency (R$ 1.234,56)
5. Displays transaction date/time in format "03/12/2025 14:30"
6. Transactions ordered by date descending (most recent first)
7. Shows loading indicator while fetching
8. Shows error message on failure
9. Shows empty state message when no transactions
10. Automatically updates after new transaction

**Backend Implementation Tasks**:

- [x] T010 [US2] Create transactions.ts handler in apps/backend/src/bank/handlers/transactions.ts
- [x] T011 [US2] Add transactionsSchema to apps/backend/src/bank/handlers/transactions.ts
- [x] T012 [US2] Import transactionsHandler and transactionsSchema in apps/backend/src/bank/routes.ts
- [x] T013 [US2] Add GET /transactions route in apps/backend/src/bank/routes.ts

**Frontend Implementation Tasks**:

- [x] T014 [US2] Create TransactionHistory component in apps/frontend/app/components/dashboard/transaction-history.tsx
- [x] T015 [US2] Import TransactionHistory component in apps/frontend/app/routes/dashboard.tsx
- [x] T016 [US2] Add TransactionHistory to dashboard layout in apps/frontend/app/routes/dashboard.tsx

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Integration, cache invalidation, and final polish

- [x] T017 Update use-deposit.ts to invalidate transactions cache in apps/frontend/app/hooks/use-deposit.ts
- [x] T018 Update use-withdraw.ts to invalidate transactions cache in apps/frontend/app/hooks/use-withdraw.ts

---

## Dependencies

### Story Completion Order

1. **Phase 1 (Setup)**: Must complete before any user story
2. **Phase 2 (Foundational)**: Must complete before any user story
3. **Phase 3 (US1 - Logout)**: Can be completed independently after Phase 1 and 2
4. **Phase 4 (US2 - Transaction History)**: Can be completed independently after Phase 1 and 2, but requires backend endpoint before frontend can be fully tested
5. **Phase 5 (Polish)**: Must complete after US2 is done

### Parallel Execution Opportunities

**Within Phase 1**:

- T001 and T002 can run in parallel (different utility files)

**Within Phase 2**:

- T003, T004, T005 can be done together (all in same file api.ts)
- T006 can be done after T005 (depends on getTransactions function)

**Within Phase 3 (US1)**:

- T007, T008, T009 must be sequential (component creation → import → usage)

**Within Phase 4 (US2)**:

- Backend tasks (T010-T013) can be done in parallel with frontend preparation, but frontend tasks (T014-T016) depend on backend endpoint being available
- T010 and T011 can be done together (handler and schema in same file)
- T012 and T013 can be done together (import and route registration in same file)
- T014, T015, T016 must be sequential (component creation → import → usage)

**Between Stories**:

- US1 (Phase 3) and US2 backend (Phase 4 backend tasks) can run in parallel after Phase 1 and 2
- US2 frontend (Phase 4 frontend tasks) should wait for US2 backend to be complete

## Implementation Strategy

### MVP Scope

**Minimum Viable Product**: User Story 1 (Logout) + User Story 2 (Transaction History)

Both stories are required for a complete feature. However, they can be implemented and tested independently:

1. **MVP Step 1**: Implement US1 (Logout) - delivers immediate security value
2. **MVP Step 2**: Implement US2 (Transaction History) - delivers transaction visibility

### Incremental Delivery

1. **Increment 1**: Setup utilities (Phase 1) + API function (Phase 2)
2. **Increment 2**: US1 - Logout functionality (Phase 3)
3. **Increment 3**: US2 - Backend endpoint (Phase 4 backend)
4. **Increment 4**: US2 - Frontend display (Phase 4 frontend)
5. **Increment 5**: Cache invalidation polish (Phase 5)

### Testing Strategy

Each user story is independently testable:

- **US1 Test**: Navigate to dashboard → Click logout → Verify redirect to login → Verify token removed
- **US2 Test**: Navigate to dashboard → Verify transaction history loads → Verify transactions displayed correctly → Perform new transaction → Verify history updates

## Notes

- Hook useAuth already exists with logout function implemented - only needs integration in Header component
- Transaction model already exists in Prisma - no migration needed
- Format-currency.ts already exists - can be reused
- React Query is already configured - can be used for transaction history
- Backend authentication middleware already exists - can be reused for transactions endpoint
