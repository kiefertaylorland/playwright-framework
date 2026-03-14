# Tasks: Product Catalog API

**Input**: Design documents from `/specs/005-product-catalog-api/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: This feature explicitly requires automated API contract tests for all user stories.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare API test scaffolding and verify baseline configuration.

- [ ] T001 Create API test scaffolding files: `tests/api/products.spec.ts`, `tests/api/auth.spec.ts`, `tests/api/categories.spec.ts`, and `utils/api-types.ts`
- [ ] T002 [P] Confirm fixture import path usage for API tests (`@fixtures` via `fixtures/index.ts`) and avoid direct `@playwright/test` imports in `tests/api/`
- [ ] T003 [P] Confirm API environment variable contract in test setup/docs (`PST_API_URL`, `PST_API_USERNAME`, `PST_API_PASSWORD`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build typed contract primitives and reusable validation constants used by all stories.

**CRITICAL**: No user-story work starts before this phase is complete.

- [ ] T004 Implement core TypeScript interfaces in `utils/api-types.ts` (`Product`, `ProductImage`, `Category`, `PaginationMeta`, `PaginationLinks`, `PaginatedResponse<T>`, `AuthRequest`, `AuthResponse`)
- [ ] T005 Add UUID validation and nil UUID constants in `utils/api-types.ts` (`UUID_PATTERN`, `NIL_UUID`)
- [ ] T006 Add lightweight env-value guard helper(s) in `tests/api/auth.spec.ts` (or shared test helper section) to fail fast when required vars are missing
- [ ] T007 Validate API-purity boundaries in `tests/api/*.spec.ts` (request fixture only, no `page`/`browser`/`context` usage)

**Checkpoint**: Foundation complete; user stories can proceed.

---

## Phase 3: User Story 1 — Product List Retrieval (Priority: P1) MVP

**Goal**: Verify `GET /products` returns HTTP 200 with paginated shape and required product fields.

**Independent Test**: Run US1 tests in `tests/api/products.spec.ts` and validate list status + per-item field contract.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add test in `tests/api/products.spec.ts` for `GET /products` returning `200` with non-empty `data`, `meta.total`, and `links` using `PaginatedResponse<Product>`
- [ ] T009 [US1] Add test in `tests/api/products.spec.ts` asserting each product includes UUID `id`, non-empty `name`, numeric `price`, and `product_image.length >= 1`

### Implementation for User Story 1

- [ ] T010 [US1] Add typed response parsing/assertion helpers in `tests/api/products.spec.ts` using interfaces from `utils/api-types.ts`

**Checkpoint**: US1 is independently testable and passable.

---

## Phase 4: User Story 2 — Product Detail Retrieval (Priority: P2)

**Goal**: Verify valid UUID detail success and nil UUID not-found behavior.

**Independent Test**: Run US2 tests in `tests/api/products.spec.ts` and validate `200` for dynamic valid UUID and `404` for nil UUID.

### Tests for User Story 2

- [ ] T011 [P] [US2] Add test in `tests/api/products.spec.ts` that fetches `GET /products`, extracts `data[0].id`, and validates `GET /products/{id}` returns `200` with full product contract
- [ ] T012 [US2] Add test in `tests/api/products.spec.ts` asserting `GET /products/{NIL_UUID}` returns `404`

### Implementation for User Story 2

- [ ] T013 [US2] Add/confirm dynamic UUID extraction utility flow inside `tests/api/products.spec.ts` (no hard-coded product UUIDs)

**Checkpoint**: US1 and US2 both pass independently.

---

## Phase 5: User Story 3 — Authentication (Priority: P3)

**Goal**: Verify login success returns `access_token` and invalid credentials are rejected.

**Independent Test**: Run US3 tests in `tests/api/auth.spec.ts` and validate status/body rules for valid and invalid credential paths.

### Tests for User Story 3

- [ ] T014 [P] [US3] Add valid-credentials test in `tests/api/auth.spec.ts` asserting `POST /auth/login` returns `200` with non-empty `access_token`
- [ ] T015 [US3] Add invalid-credentials test in `tests/api/auth.spec.ts` asserting status is `401` or `422` and `access_token` is absent

### Implementation for User Story 3

- [ ] T016 [US3] Implement request payload construction in `tests/api/auth.spec.ts` using env vars (`PST_API_USERNAME`, `PST_API_PASSWORD`) and typed `AuthRequest`

**Checkpoint**: US3 passes independently.

---

## Phase 6: User Story 4 — Category Listing and Authorised Access (Priority: P4)

**Goal**: Verify public categories list and bearer-token product-list parity with the unauthenticated paginated contract.

**Independent Test**: Run US4 tests in `tests/api/categories.spec.ts` and validate category array contract plus token-authenticated `GET /products` full paginated shape parity with US1.

### Tests for User Story 4

- [ ] T017 [P] [US4] Add categories-list test in `tests/api/categories.spec.ts` asserting `GET /categories` returns `200` with non-empty array and required fields (`id`, `name`)
- [ ] T018 [US4] Add bearer-token compatibility test in `tests/api/categories.spec.ts` that logs in within the same test body and calls `GET /products` with `Authorization: Bearer <token>`, asserting full `PaginatedResponse<Product>` parity with US1: `200`, non-empty `data`, `meta.total`, and `links`

### Implementation for User Story 4

- [ ] T019 [US4] Add in-test token acquisition helper flow in `tests/api/categories.spec.ts` (re-authenticate in same test body; no cross-test token sharing)

**Checkpoint**: All four user stories pass independently.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Final quality gates and constitution compliance checks.

- [ ] T020 [P] Run lint and resolve findings (`npm run lint`)
- [ ] T021 [P] Run type-check and resolve findings (`npx tsc --noEmit`)
- [ ] T022 Run API suite (`npx playwright test tests/api/ --workers=4`)
- [ ] T023 Validate constitution/API-purity checks from `specs/005-product-catalog-api/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) starts immediately
- Foundational (Phase 2) depends on Setup and blocks all user stories
- User stories (Phases 3-6) depend on Foundational completion
- Polish (Phase 7) depends on completion of desired user stories

### User Story Dependencies

- US1 (P1) starts after Phase 2
- US2 (P2) starts after Phase 2 and can share `products.spec.ts` with US1 while remaining independently testable
- US3 (P3) starts after Phase 2 and is independent of US1/US2
- US4 (P4) starts after Phase 2; bearer-token test obtains token within its own test body

### Within Each User Story

- Write tests first and confirm they fail before implementation
- Keep assertions contract-focused (presence/type/shape), not value-specific for dynamic catalog data
- Keep token and UUID setup self-contained inside each test body

---

## Parallel Opportunities

- T002 and T003 can run in parallel (different setup concerns)
- T008 and T014 can run in parallel (different spec files)
- T011 and T015 can run in parallel (different stories/files)
- T020 and T021 can run in parallel after implementation completes

---

## Parallel Example: User Story 1 + User Story 3

```bash
# Parallel work across independent files:
Task T008: product-list shape test in tests/api/products.spec.ts
Task T014: auth success test in tests/api/auth.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phases 1-2
2. Complete Phase 3 (US1)
3. Validate product-list contract independently
4. Demo baseline API catalogue contract

### Incremental Delivery

1. Foundation complete (Phases 1-2)
2. Deliver US1 (product list)
3. Add US2 (product detail)
4. Add US3 (auth)
5. Add US4 (categories + bearer compatibility)
6. Run Phase 7 quality gates

### Parallel Team Strategy

1. Engineer A: `tests/api/products.spec.ts` (T008-T013)
2. Engineer B: `tests/api/auth.spec.ts` + auth-related helpers (T006, T014-T016)
3. Engineer C: `tests/api/categories.spec.ts` (T017-T019)
4. Shared: types and quality gates (`utils/api-types.ts`, T020-T023)

---

## Notes

- `[P]` marks tasks suitable for parallel execution when dependencies permit
- API tests must use request fixture only; never launch browser context objects
- Import `test`/`expect` from fixtures only (`@fixtures` / `fixtures/index.ts`)
- Never hard-code credentials or product UUIDs; use env vars and dynamic extraction
