#Implementation Tasks: Protected Routes Authentication

**Feature**: Protected Routes Authentication
**Branch**: `002-protected-routes`
**Date**: 2025-12-02
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

##Overview

Implementar middleware de autenticação para proteger rotas da API usando validação de tokens JWT. O sistema deve validar tokens no header `Authorization: Bearer <token>`, verificar assinatura e expiração, e retornar 401 Unauthorized para requisições não autenticadas ou com tokens inválidos.

##Dependencies

###Story Completion Order

1. **User Story 1** (P1) - Block Unauthenticated Access: Foundation for all authentication
2. **User Story 2** (P1) - Validate JWT Token: Depends on User Story 1 (header parsing)
3. **User Story 3** (P2) - Clear Error Messages: Can be implemented alongside User Stories 1 and 2

**Note**: User Stories 1 and 2 are both P1 and work together. User Story 3 enhances both but is lower priority.

##Implementation Strategy

**MVP Scope**: User Stories 1 and 2 (P1) - Complete authentication protection
**Incremental Delivery**:

- Phase 3-4: Core authentication (MVP)
- Phase 5: Enhanced error messages
- Phase 6: Testing and polish

##Parallel Execution Opportunities

###Phase 2 (Foundational)

- T005 and T006 can be done in parallel (types and error constants in different files)

###User Story 1

- T008, T009, T010, T011 can be done in parallel (different validation checks)

###User Story 2

- T016, T017, T018, T019 can be done in parallel (different validation steps)

###User Story 3

- All tasks (T027-T030) can be done in parallel (error message improvements)

###Testing Phase

- Unit tests (T036-T048) and integration tests (T049-T053) can be written in parallel

---

##Phase 1: Setup

**Goal**: Verify prerequisites and project structure

- [x] T001 Verify jsonwebtoken dependency is installed in apps/backend/package.json
- [x] T002 Verify BETTER_AUTH_SECRET environment variable is configured in apps/backend/.env
- [x] T003 Verify Fastify server structure exists in apps/backend/src/index.ts
- [x] T004 Verify middleware directory exists at apps/backend/src/middleware/

**Checkpoint**: Prerequisites verified - ready to implement middleware

---

##Phase 2: Foundational Tasks

**Goal**: Create foundational types and error constants needed by all user stories

- [x] T005 Create AuthenticatedRequest interface extending FastifyRequest in apps/backend/src/types/auth.ts
- [x] T006 Create authentication error constants in apps/backend/src/middleware/authentication.ts (AUTH_REQUIRED, INVALID_FORMAT, INVALID_TOKEN)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

##Phase 3: User Story 1 - Block Unauthenticated Access to Protected Routes (Priority: P1) MVP

**Goal**: Implement middleware that blocks access to protected routes without authentication token

**Independent Test**: Attempt to access a protected route without an `Authorization` header and verify that the system returns 401 Unauthorized with error message "Authentication required".

###Implementation for User Story 1

- [x] T007 [US1] Create authentication middleware function skeleton in apps/backend/src/middleware/authentication.ts
- [x] T008 [US1] Implement Authorization header presence check in apps/backend/src/middleware/authentication.ts
- [x] T009 [US1] Implement empty Authorization header validation in apps/backend/src/middleware/authentication.ts
- [x] T010 [US1] Implement Bearer format validation (must start with "Bearer ") in apps/backend/src/middleware/authentication.ts
- [x] T011 [US1] Implement token value presence check (after "Bearer " prefix) in apps/backend/src/middleware/authentication.ts
- [x] T012 [US1] Implement 401 Unauthorized response for missing header in apps/backend/src/middleware/authentication.ts
- [x] T013 [US1] Implement 401 Unauthorized response for invalid format in apps/backend/src/middleware/authentication.ts
- [x] T014 [US1] Handle multiple Authorization headers (use first one) in apps/backend/src/middleware/authentication.ts
- [x] T015 [US1] Handle case-insensitive Authorization header name in apps/backend/src/middleware/authentication.ts

**Checkpoint**: At this point, User Story 1 should be fully functional. Middleware blocks requests without proper Authorization header and returns 401 Unauthorized.

---

##Phase 4: User Story 2 - Validate JWT Token Format and Signature (Priority: P1) MVP

**Goal**: Implement JWT token validation (signature and expiration) to ensure only valid tokens grant access

**Independent Test**: Send request with various invalid token formats (malformed JWT, expired token, tampered token) and verify all are rejected with 401 Unauthorized. Send request with valid token and verify request proceeds to route handler.

###Implementation for User Story 2

- [x] T016 [US2] Extract JWT token from Authorization header (remove "Bearer " prefix) in apps/backend/src/middleware/authentication.ts
- [x] T017 [US2] Implement JWT token structure validation (3 parts separated by '.') in apps/backend/src/middleware/authentication.ts
- [x] T018 [US2] Implement JWT signature verification using BETTER_AUTH_SECRET in apps/backend/src/middleware/authentication.ts
- [x] T019 [US2] Implement JWT expiration validation (exp claim) in apps/backend/src/middleware/authentication.ts
- [x] T020 [US2] Configure jwt.verify to use HS256 algorithm in apps/backend/src/middleware/authentication.ts
- [x] T021 [US2] Handle malformed JWT token errors (return 401) in apps/backend/src/middleware/authentication.ts
- [x] T022 [US2] Handle expired token errors (return 401) in apps/backend/src/middleware/authentication.ts
- [x] T023 [US2] Handle invalid signature errors (return 401) in apps/backend/src/middleware/authentication.ts
- [x] T024 [US2] Attach decoded token payload to request.user in apps/backend/src/middleware/authentication.ts
- [x] T025 [US2] Allow request to proceed when token is valid in apps/backend/src/middleware/authentication.ts
- [x] T026 [US2] Ensure validation is stateless (no database queries) in apps/backend/src/middleware/authentication.ts

**Checkpoint**: At this point, User Story 2 should be fully functional. Middleware validates JWT tokens and only allows valid, non-expired tokens to proceed.

---

##Phase 5: User Story 3 - Provide Clear Error Messages for Authentication Failures (Priority: P2)

**Goal**: Enhance error messages to be clear and actionable without leaking sensitive information

**Independent Test**: Send various invalid authentication requests and verify error responses contain clear, non-sensitive error messages in JSON format.

###Implementation for User Story 3

- [x] T027 [US3] Standardize error message format to JSON { "error": "..." } in apps/backend/src/middleware/authentication.ts
- [x] T028 [US3] Ensure error messages are generic (don't differentiate expired vs invalid) in apps/backend/src/middleware/authentication.ts
- [x] T029 [US3] Verify error messages don't leak sensitive information in apps/backend/src/middleware/authentication.ts
- [x] T030 [US3] Add Content-Type: application/json header to error responses in apps/backend/src/middleware/authentication.ts

**Checkpoint**: At this point, User Story 3 should be complete. Error messages are clear, consistent, and secure.

---

##Phase 6: Integration & Application

**Goal**: Integrate middleware with Fastify server and provide mechanism to apply to routes

- [x] T031 Create authenticateRequest function export in apps/backend/src/middleware/authentication.ts
- [x] T032 Create example protected route plugin in apps/backend/src/plugins/protected-routes.ts (optional, for demonstration)
- [x] T033 Document how to apply middleware to routes in apps/backend/src/middleware/authentication.ts (JSDoc comments)
- [x] T034 Verify middleware can be applied via fastify.addHook('preHandler') in apps/backend/src/index.ts (example)
- [x] T035 Verify middleware can be applied via fastify.register plugin pattern in apps/backend/src/plugins/protected-routes.ts (example)

**Checkpoint**: Middleware is integrated and ready to be applied to protected routes in future features.

---

##Phase 7: Testing

**Goal**: Create comprehensive tests for authentication middleware

###Unit Tests

- [x] T036 [P] Create unit test file apps/backend/tests/unit/authentication.test.ts
- [x] T037 [P] [US1] Test missing Authorization header returns 401 in apps/backend/tests/unit/authentication.test.ts
- [x] T038 [P] [US1] Test empty Authorization header returns 401 in apps/backend/tests/unit/authentication.test.ts
- [x] T039 [P] [US1] Test invalid Bearer format returns 401 in apps/backend/tests/unit/authentication.test.ts
- [x] T040 [P] [US1] Test missing token value returns 401 in apps/backend/tests/unit/authentication.test.ts
- [x] T041 [P] [US1] Test multiple Authorization headers (uses first) in apps/backend/tests/unit/authentication.test.ts
- [x] T042 [P] [US2] Test malformed JWT token returns 401 in apps/backend/tests/unit/authentication.test.ts
- [x] T043 [P] [US2] Test expired JWT token returns 401 in apps/backend/tests/unit/authentication.test.ts
- [x] T044 [P] [US2] Test invalid signature returns 401 in apps/backend/tests/unit/authentication.test.ts
- [x] T045 [P] [US2] Test valid JWT token allows request to proceed in apps/backend/tests/unit/authentication.test.ts
- [x] T046 [P] [US2] Test token payload is attached to request.user in apps/backend/tests/unit/authentication.test.ts
- [x] T047 [P] [US3] Test error messages are in JSON format in apps/backend/tests/unit/authentication.test.ts
- [x] T048 [P] [US3] Test error messages are generic (no sensitive info) in apps/backend/tests/unit/authentication.test.ts

###Integration Tests

- [x] T049 [P] Create integration test file apps/backend/tests/integration/protected-routes.test.ts
- [x] T050 [P] [US1] Test protected route without token returns 401 in apps/backend/tests/integration/protected-routes.test.ts
- [x] T051 [P] [US2] Test protected route with valid token returns route response in apps/backend/tests/integration/protected-routes.test.ts
- [x] T052 [P] [US2] Test protected route with invalid token returns 401 in apps/backend/tests/integration/protected-routes.test.ts
- [x] T053 [P] Test middleware performance is <50ms in apps/backend/tests/integration/protected-routes.test.ts

**Checkpoint**: All tests passing - middleware is fully tested and validated.

---

##Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Final polish, documentation, and performance validation

- [x] T054 Add JSDoc comments to authenticateRequest function in apps/backend/src/middleware/authentication.ts
- [x] T055 Add JSDoc comments to AuthenticatedRequest interface in apps/backend/src/types/auth.ts
- [x] T056 Verify error handling for edge cases (whitespace after Bearer, case-insensitive headers) in apps/backend/src/middleware/authentication.ts
- [x] T057 Verify stateless validation (no database queries) in apps/backend/src/middleware/authentication.ts
- [x] T058 Add performance logging (optional) to verify <50ms target in apps/backend/src/middleware/authentication.ts
- [x] T059 Update README or documentation with middleware usage examples (if applicable)

**Checkpoint**: Feature complete - middleware is production-ready.

---

##Task Summary

- **Total Tasks**: 59
- **Setup Tasks**: 4 (Phase 1)
- **Foundational Tasks**: 2 (Phase 2)
- **User Story 1 Tasks**: 9 (Phase 3)
- **User Story 2 Tasks**: 11 (Phase 4)
- **User Story 3 Tasks**: 4 (Phase 5)
- **Integration Tasks**: 5 (Phase 6)
- **Testing Tasks**: 18 (Phase 7)
- **Polish Tasks**: 6 (Phase 8)

##MVP Scope

**Minimum Viable Product**: Phases 1-4 (User Stories 1 and 2)

- Complete authentication protection
- JWT token validation
- Blocks unauthorized access
- Validates token signature and expiration

**Enhanced Version**: Add Phase 5 (User Story 3) for improved error messages

##Notes

- All tasks follow strict checklist format with Task ID, Story label, and file paths
- Tasks marked with [P] can be executed in parallel
- Tasks marked with [US1], [US2], [US3] belong to specific user stories
- MVP focuses on User Stories 1 and 2 (P1) for complete authentication protection
- User Story 3 (P2) enhances developer experience but is not critical for security
