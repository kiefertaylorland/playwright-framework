# Tasks: Authentication Flows — SauceDemo

**Input**: Design documents from `/specs/001-saucedemo-auth/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: This feature explicitly requires automated Playwright coverage for all user stories.

**Organization**: Tasks are grouped by user story so each story can be built and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project files and baseline structure for the auth feature.

- [ ] T001 Create Playwright/TypeScript project scaffolding (`package.json`, `tsconfig.json`, `playwright.config.ts`) at repository root
- [ ] T002 [P] Create directories `pages/`, `tests/e2e/`, `fixtures/`, `utils/`, `.auth/`
- [ ] T003 [P] Update `.gitignore` to include `.env`, `.auth/`, and report artifacts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core auth infrastructure required by all user stories.

**⚠️ CRITICAL**: No user-story implementation starts before this phase is complete.

- [ ] T004 Implement route constants in `utils/routes.ts` (`ROUTES.LOGIN`, `ROUTES.INVENTORY`)
- [ ] T005 Implement credential helpers/constants in `utils/auth.ts` (`getSauceCredentials`, `LOCKED_OUT_USER`, `INVALID_CREDENTIALS`)
- [ ] T006 [P] Implement `LoginPage` in `pages/login.page.ts` (`goto`, `fillUsername`, `fillPassword`, `submit`, `login`, `getErrorMessage`, `isErrorVisible`)
- [ ] T007 [P] Implement auth-scoped `InventoryPage` in `pages/inventory.page.ts` (`goto`, `isOnInventoryPage`, `openBurgerMenu`, `logout`)
- [ ] T008 Implement fixture extension in `fixtures/index.ts` exporting `{ test, expect }` with typed `loginPage` and `inventoryPage` fixtures
- [ ] T009 Implement auth bootstrap in `global-setup.ts` to login with `LoginPage` and save `.auth/standard-user.json`
- [ ] T010 Configure `playwright.config.ts` defaults: `globalSetup`, `storageState`, 3 browser projects, parallelism, retries, reporter

**Checkpoint**: Foundation complete; user stories can now proceed.

---

## Phase 3: User Story 1 — Successful Login (Priority: P1) MVP

**Goal**: Validate successful login redirects authenticated user to inventory.

**Independent Test**: Run `tests/e2e/login.spec.ts` happy-path test and verify inventory URL.

### Tests for User Story 1

- [ ] T011 [P] [US1] Create `tests/e2e/login.spec.ts` with `test.use({ storageState: undefined })` and fixture imports only
- [ ] T012 [US1] Add successful-login test in `tests/e2e/login.spec.ts` asserting redirect to `/inventory.html` and no error banner

### Implementation for User Story 1

- [ ] T013 [US1] Wire happy-path login flow in `pages/login.page.ts` to support composed `login(username, password)` action used by test and global setup

**Checkpoint**: US1 is independently testable and passable.

---

## Phase 4: User Story 2 — Login Error States (Priority: P2)

**Goal**: Validate locked user, invalid credentials, and required-field errors with exact messages.

**Independent Test**: Run only error-state tests in `tests/e2e/login.spec.ts` and verify exact text for all four cases.

### Tests for User Story 2

- [ ] T014 [P] [US2] Add locked-out account test in `tests/e2e/login.spec.ts`
- [ ] T015 [P] [US2] Add invalid-credentials test in `tests/e2e/login.spec.ts`
- [ ] T016 [P] [US2] Add empty-username validation test in `tests/e2e/login.spec.ts`
- [ ] T017 [P] [US2] Add empty-password validation test in `tests/e2e/login.spec.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Define exact auth error message constants in `pages/login.page.ts` (or shared constants file) per spec contract
- [ ] T019 [US2] Ensure `LoginPage.getErrorMessage()` returns normalized banner text for exact assertions in `tests/e2e/login.spec.ts`

**Checkpoint**: US1 and US2 both pass independently.

---

## Phase 5: User Story 3 — Logout (Priority: P3)

**Goal**: Validate logout returns to login and blocks direct access to protected inventory URL.

**Independent Test**: Run logout tests in `tests/e2e/session.spec.ts`; confirm redirect behavior from logout and direct URL guard.

### Tests for User Story 3

- [ ] T020 [P] [US3] Create `tests/e2e/session.spec.ts` with fixture imports and default `storageState` (no override)
- [ ] T021 [US3] Add logout flow test in `tests/e2e/session.spec.ts` asserting return to login page
- [ ] T022 [US3] Add post-logout URL-guard assertion in same logout test body (`page.goto('/inventory.html')` redirects to login)

### Implementation for User Story 3

- [ ] T023 [US3] Implement reliable menu/logout interaction in `pages/inventory.page.ts` (`openBurgerMenu` + `logout` with necessary waits)

**Checkpoint**: US3 passes independently with no cross-test dependency.

---

## Phase 6: User Story 4 — Session Persistence (Priority: P4)

**Goal**: Validate authenticated session survives page reload within same context.

**Independent Test**: Run persistence test in `tests/e2e/session.spec.ts`; verify still on inventory and inventory content visible after reload.

### Tests for User Story 4

- [ ] T024 [P] [US4] Add session-reload persistence test in `tests/e2e/session.spec.ts`
- [ ] T025 [US4] Add assertions in `tests/e2e/session.spec.ts` for inventory URL, no login form, and visible inventory items after reload

### Implementation for User Story 4

- [ ] T026 [US4] Ensure `InventoryPage.isOnInventoryPage()` and minimal inventory-presence helper support persistence assertions in `pages/inventory.page.ts`

**Checkpoint**: All four user stories pass independently.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Validate quality gates and documentation after story completion.

- [ ] T027 [P] Run lint and fix issues (`npm run lint`)
- [ ] T028 [P] Run type-check and fix issues (`npx tsc --noEmit`)
- [ ] T029 Run auth suite across browsers (`npx playwright test tests/e2e/login.spec.ts tests/e2e/session.spec.ts --project=chromium --project=firefox --project=webkit`)
- [ ] T030 Validate constitution guard commands from `specs/001-saucedemo-auth/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) starts immediately
- Foundational (Phase 2) depends on Setup and blocks all user stories
- User stories (Phases 3-6) depend on Foundational completion
- Polish (Phase 7) depends on completion of desired user stories

### User Story Dependencies

- US1 (P1) can start immediately after Phase 2
- US2 (P2) can start after Phase 2; independent of US1 behavior
- US3 (P3) can start after Phase 2; independent of login-form tests
- US4 (P4) can start after Phase 2; implemented in same file as US3 but independently testable

### Within Each User Story

- Write tests first and confirm they fail before implementation
- Implement page-object behavior before finalizing assertions that depend on it
- Complete and validate each story before moving to the next priority

---

## Parallel Opportunities

- T002 and T003 can run in parallel (different setup files)
- T006 and T007 can run in parallel (different page object files)
- T014–T017 can run in parallel (separate tests in same spec file, coordinated merge)
- T027 and T028 can run in parallel after implementation completes

---

## Parallel Example: User Story 2

```bash
# Implement error-state tests in parallel, then merge:
Task T014: locked-out account test in tests/e2e/login.spec.ts
Task T015: invalid-credentials test in tests/e2e/login.spec.ts
Task T016: empty-username test in tests/e2e/login.spec.ts
Task T017: empty-password test in tests/e2e/login.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate happy-path login independently
4. Demo/deploy baseline auth entry flow

### Incremental Delivery

1. Foundation complete (Phases 1-2)
2. Deliver US1 (successful login)
3. Add US2 (error states)
4. Add US3 (logout + guard)
5. Add US4 (session persistence)
6. Run Phase 7 quality gates

### Team Parallelization

1. One engineer: foundational config and fixtures (T004-T010)
2. One engineer: login/error story tests (T011-T019)
3. One engineer: session/logout story tests (T020-T026)
4. Converge on lint/type/test gates (T027-T030)

---

## Notes

- `[P]` marks tasks that can proceed in parallel when dependencies permit
- Keep selectors out of test files; all selector changes belong in `pages/`
- Import `test`/`expect` from fixtures only (never directly from `@playwright/test`)
- Keep logout + post-logout guard in same test body to preserve isolation
- Commit by phase or by independently passing user story
