# Tasks: Dashboard Deposit and Withdraw Operations

**Input**: Design documents from `/specs/005-deposit-withdraw/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in specification, so test tasks are not included. Focus on implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2])
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/frontend/`, `apps/backend/`
- All paths shown use absolute structure from repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verification of existing infrastructure

- [x] T001 Verify backend endpoint `/v1/event` is functional in apps/backend/src/bank/handlers/event.ts
- [x] T002 Verify frontend dashboard route exists in apps/frontend/app/routes/dashboard.tsx
- [x] T003 [P] Verify React Query is configured in apps/frontend/app/lib/query-client.ts
- [x] T004 [P] Verify react-hook-form and zod are installed in apps/frontend/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend modification that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Modify event handler to identify account automatically via JWT in apps/backend/src/bank/handlers/event.ts
- [x] T006 Update deposit case to use getOrCreateDefaultAccount(userId) in apps/backend/src/bank/handlers/event.ts
- [x] T007 Update withdraw case to use getOrCreateDefaultAccount(userId) in apps/backend/src/bank/handlers/event.ts
- [x] T008 Add authentication middleware to event route if not already present in apps/backend/src/bank/routes.ts
- [x] T009 Update event handler to accept requests without destination/origin when authenticated in apps/backend/src/bank/handlers/event.ts
- [x] T010 Test backend modifications with authenticated requests in apps/backend/tests/integration/

**Checkpoint**: Foundation ready - backend now identifies account automatically. User story implementation can now begin.

---

## Phase 3: User Story 1 - Deposit Money (Priority: P1) 🎯 MVP

**Goal**: As an authenticated user, I want to deposit money into my account through the dashboard, so that I can add funds to my balance.

**Independent Test**: Navigate to dashboard, enter deposit amount (R$ 0,01 to R$ 999.999,99), submit form, verify balance updates and success message appears.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Add deposit() function to apps/frontend/app/lib/api.ts
- [ ] T012 [P] [US1] Create use-deposit hook in apps/frontend/app/hooks/use-deposit.ts
- [ ] T013 [P] [US1] Create transaction amount validation schema with zod in apps/frontend/app/lib/validation.ts
- [ ] T014 [US1] Create deposit-form component in apps/frontend/app/components/dashboard/deposit-form.tsx
- [ ] T015 [US1] Implement currency input field with validation in apps/frontend/app/components/dashboard/deposit-form.tsx
- [ ] T016 [US1] Implement submit button with loading state (spinner + "Processando...") in apps/frontend/app/components/dashboard/deposit-form.tsx
- [ ] T017 [US1] Add form validation with react-hook-form in apps/frontend/app/components/dashboard/deposit-form.tsx
- [ ] T018 [US1] Implement success message display after deposit in apps/frontend/app/components/dashboard/deposit-form.tsx
- [ ] T019 [US1] Implement error message display for deposit failures in apps/frontend/app/components/dashboard/deposit-form.tsx
- [ ] T020 [US1] Add balance cache invalidation after successful deposit in apps/frontend/app/hooks/use-deposit.ts
- [ ] T021 [US1] Integrate deposit-form into dashboard route in apps/frontend/app/routes/dashboard.tsx
- [ ] T022 [US1] Clear input field after successful deposit in apps/frontend/app/components/dashboard/deposit-form.tsx

**Checkpoint**: At this point, User Story 1 (Deposit) should be fully functional and testable independently. Users can deposit money and see balance update.

---

## Phase 4: User Story 2 - Withdraw Money (Priority: P2)

**Goal**: As an authenticated user, I want to withdraw money from my account through the dashboard, so that I can access my funds.

**Independent Test**: Navigate to dashboard with positive balance, enter withdrawal amount that doesn't exceed balance, submit form, verify balance decreases and success message appears.

### Implementation for User Story 2

- [ ] T023 [P] [US2] Add withdraw() function to apps/frontend/app/lib/api.ts
- [ ] T024 [P] [US2] Create use-withdraw hook in apps/frontend/app/hooks/use-withdraw.ts
- [ ] T025 [US2] Create withdraw-form component in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T026 [US2] Implement currency input field with validation in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T027 [US2] Implement submit button with loading state (spinner + "Processando...") in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T028 [US2] Add form validation with react-hook-form in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T029 [US2] Add client-side balance check before submit in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T030 [US2] Implement insufficient funds error message in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T031 [US2] Implement success message display after withdrawal in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T032 [US2] Implement error message display for withdrawal failures in apps/frontend/app/components/dashboard/withdraw-form.tsx
- [ ] T033 [US2] Add balance cache invalidation after successful withdrawal in apps/frontend/app/hooks/use-withdraw.ts
- [ ] T034 [US2] Integrate withdraw-form into dashboard route in apps/frontend/app/routes/dashboard.tsx
- [ ] T035 [US2] Clear input field after successful withdrawal in apps/frontend/app/components/dashboard/withdraw-form.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can deposit and withdraw money.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final refinements

- [ ] T036 [P] Add loading state prevention for duplicate submissions across both forms in apps/frontend/app/components/dashboard/
- [ ] T037 [P] Ensure consistent currency formatting (R$ 1.234,56) in all form inputs in apps/frontend/app/components/dashboard/
- [ ] T038 [P] Add keyboard navigation support for forms in apps/frontend/app/components/dashboard/
- [ ] T039 [P] Verify responsive design for mobile devices in apps/frontend/app/components/dashboard/
- [ ] T040 [P] Add error handling for network timeouts in apps/frontend/app/lib/api.ts
- [ ] T041 [P] Add error handling for token expiration (401) in apps/frontend/app/hooks/use-deposit.ts and apps/frontend/app/hooks/use-withdraw.ts
- [ ] T042 Verify all edge cases from spec are handled in apps/frontend/app/components/dashboard/
- [ ] T043 Run lint and format on all modified files
- [ ] T044 Test complete user flows (deposit → check balance → withdraw → check balance)
- [ ] T045 Validate quickstart.md implementation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - Can be MVP
- **User Story 2 (Phase 4)**: Depends on Foundational completion - Can work independently of US1
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1, but benefits from having funds to withdraw

### Within Each User Story

- API functions before hooks
- Hooks before components
- Components before integration
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T003 and T004 can run in parallel
- **Phase 2**: T005-T009 can be worked on sequentially (same file modifications)
- **Phase 3 (US1)**: T011, T012, T013 can run in parallel (different files)
- **Phase 4 (US2)**: T023, T024 can run in parallel (different files)
- **Phase 5**: All tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch API function and hook together:
Task: "Add deposit() function to apps/frontend/app/lib/api.ts"
Task: "Create use-deposit hook in apps/frontend/app/hooks/use-deposit.ts"
Task: "Create transaction amount validation schema with zod in apps/frontend/app/lib/validation.ts"

# These can be done in parallel as they're in different files
```

---

## Parallel Example: User Story 2

```bash
# Launch API function and hook together:
Task: "Add withdraw() function to apps/frontend/app/lib/api.ts"
Task: "Create use-withdraw hook in apps/frontend/app/hooks/use-withdraw.ts"

# These can be done in parallel as they're in different files
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify infrastructure)
2. Complete Phase 2: Foundational (modify backend - CRITICAL)
3. Complete Phase 3: User Story 1 (Deposit)
4. **STOP and VALIDATE**: Test deposit flow independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Backend ready for automatic account identification
2. Add User Story 1 (Deposit) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Withdraw) → Test independently → Deploy/Demo
4. Add Polish phase → Final refinements → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Deposit)
   - Developer B: User Story 2 (Withdraw) - can start in parallel
3. Stories complete and integrate independently
4. Team works on Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [US1]/[US2] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Backend modification (Phase 2) is CRITICAL and blocks all user stories
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
