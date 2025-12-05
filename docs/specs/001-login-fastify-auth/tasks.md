#Tasks: Login no Sistema

**Input**: Design documents from `/specs/001-login-fastify-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included as they were not explicitly requested in the feature specification.

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

##Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

##Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Install Fastify and related dependencies in apps/backend/package.json
- [x] T002 Install Better Auth package in apps/backend/package.json
- [x] T003 [P] Install @fastify/cors package in apps/backend/package.json
- [x] T004 [P] Create directory structure apps/backend/src/auth/
- [x] T005 [P] Create directory structure apps/backend/src/middleware/
- [x] T006 [P] Create directory structure apps/backend/src/types/
- [x] T007 [P] Create directory structure apps/backend/tests/integration/
- [x] T008 [P] Create directory structure apps/backend/tests/unit/
- [x] T009 [P] Create directory structure packages/shared/src/schemas/ (if not exists)

---

##Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create Zod login schema in packages/shared/src/schemas/auth.ts
- [x] T011 Export login schema from packages/shared/src/schemas/index.ts
- [x] T012 [P] Create Better Auth configuration in apps/backend/src/auth/better-auth.ts
- [x] T013 [P] Create TypeScript types for authentication in apps/backend/src/types/auth.ts
- [x] T014 Create validation middleware in apps/backend/src/middleware/validation.ts
- [x] T015 Migrate Express server to Fastify in apps/backend/src/index.ts
- [x] T016 Configure CORS plugin in apps/backend/src/index.ts
- [x] T017 Create environment variables configuration (.env.example or documentation)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

##Phase 3: User Story 1 - Autenticação com Credenciais Válidas (Priority: P1) MVP

**Goal**: Implementar endpoint `/login` que aceita username e senha, valida formato, verifica credenciais hardcoded (admin/admin123), e retorna token JWT em caso de sucesso.

**Independent Test**: Enviar requisição POST para `/login` com credenciais válidas (username: "admin", pass: "admin123") e verificar que retorna status 200 OK com token JWT no formato `{ "token": "<jwt_token>" }`.

###Implementation for User Story 1

- [x] T018 [US1] Create Better Auth route handler in apps/backend/src/auth/routes.ts
- [x] T019 [US1] Implement POST /login endpoint in apps/backend/src/auth/routes.ts
- [x] T020 [US1] Integrate format validation middleware in /login endpoint
- [x] T021 [US1] Implement credential verification logic (hardcoded admin/admin123) in apps/backend/src/auth/routes.ts
- [x] T022 [US1] Implement JWT token generation via Better Auth in apps/backend/src/auth/routes.ts
- [x] T023 [US1] Implement success response (200 OK with token) in apps/backend/src/auth/routes.ts
- [x] T024 [US1] Register auth routes in apps/backend/src/index.ts
- [x] T025 [US1] Implement error handling for 400 Bad Request (format validation failures) in apps/backend/src/auth/routes.ts
- [x] T026 [US1] Implement error handling for 405 Method Not Allowed (non-POST methods) in apps/backend/src/auth/routes.ts
- [x] T027 [US1] Test endpoint with valid credentials (admin/admin123) via cURL or Postman

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Endpoint `/login` accepts POST requests, validates format, verifies credentials, and returns JWT token on success.

---

##Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and validation

- [x] T028 [P] Validate all edge cases from spec.md (missing fields, empty body, invalid format, wrong HTTP method)
- [x] T029 [P] Verify response times meet SC-001 (< 2 seconds)
- [x] T030 [P] Test concurrent requests to verify SC-003 (no performance degradation)
- [x] T031 [P] Update quickstart.md with actual implementation details if needed
- [x] T032 [P] Verify OpenAPI contract matches implementation in specs/001-login-fastify-auth/contracts/login-api.yaml
- [x] T033 Code cleanup and refactoring
- [x] T034 [P] Add error logging for authentication failures in apps/backend/src/auth/routes.ts
- [x] T035 [P] Document environment variables in README or .env.example

---

##Dependencies & Execution Order

###Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **Polish (Phase 4)**: Depends on User Story 1 completion

###User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

###Within User Story 1

- Zod schema (T010) before validation middleware (T014)
- Better Auth config (T012) before route handler (T018)
- Validation middleware (T014) before endpoint implementation (T019-T020)
- Fastify migration (T015) before route registration (T024)
- Endpoint implementation (T019-T023) before error handling (T025-T026)
- All implementation tasks before testing (T027)

###Parallel Opportunities

**Phase 1 (Setup)**:

- T003, T004, T005, T006, T007, T008, T009 can run in parallel (different directories/files)

**Phase 2 (Foundational)**:

- T012, T013 can run in parallel (different files)
- T010, T011 must run sequentially (T011 depends on T010)

**Phase 4 (Polish)**:

- T028, T029, T030, T031, T032, T034, T035 can run in parallel (different concerns)

---

##Parallel Example: User Story 1

```bash
#After Foundational phase, these can be prepared in parallel:
#- Better Auth route handler structure
#- TypeScript types definition
#- Error response formatting

#But implementation must follow order:
#1. Create route handler (T018)
#2. Implement POST /login (T019)
#3. Add validation (T020)
#4. Add credential check (T021)
#5. Add token generation (T022)
#6. Add success response (T023)
#7. Register routes (T024)
#8. Add error handling (T025-T026)
#9. Test (T027)
```

---

##Implementation Strategy

###MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install dependencies, create directories)
2. Complete Phase 2: Foundational (Zod schema, Better Auth config, Fastify migration, validation middleware)
3. Complete Phase 3: User Story 1 (endpoint /login completo)
4. **STOP and VALIDATE**: Test User Story 1 independently via cURL/Postman
5. Deploy/demo if ready

###Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add Polish tasks → Final validation → Deploy

###Execution Flow

**Sequential (Single Developer)**:

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (Polish)
```

**Parallel Opportunities**:

- Phase 1: Multiple directory creation tasks can run in parallel
- Phase 2: Better Auth config and types can be prepared in parallel
- Phase 4: All polish tasks can run in parallel after US1 is complete

---

##Notes

- [P] tasks = different files, no dependencies
- [US1] label maps task to User Story 1 for traceability
- User Story 1 should be independently completable and testable
- Commit after each task or logical group
- Stop at checkpoint to validate story independently
- Credentials hardcoded: username="admin", password="admin123"
- Validation order: Format validation BEFORE credential verification (FR-002c)
- Error responses: 400 Bad Request for format errors, 405 Method Not Allowed for wrong HTTP method
- Success response: 200 OK with `{ "token": "<jwt_token>" }`
