# Tasks: Shopping Cart — SauceDemo

**Input**: Design documents from `/specs/003-shopping-cart/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: This feature explicitly requires automated Playwright coverage for all user stories.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare cart-feature scaffolding and verify prerequisites.

- [x] T001 Create feature file scaffolding: `pages/cart.page.ts` and `tests/e2e/cart.spec.ts`
- [x] T002 [P] Confirm authenticated defaults in `playwright.config.ts` (`storageState: '.auth/standard-user.json'` remains default)
- [x] T003 [P] Confirm `@fixtures` / `fixtures/index.ts` import path availability in `tsconfig.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core cart page object and fixture plumbing required by all stories.

**CRITICAL**: No user-story work starts before this phase is complete.

- [x] T004 Implement navigation methods in `pages/cart.page.ts` (`goto`, `isOnCartPage`)
- [x] T005 Implement cart row readers in `pages/cart.page.ts` (`getCartItems`, `getCartItemNames`, `getCartRowCount`)
- [x] T006 Implement DOM badge parsing in `pages/cart.page.ts` (`getCartBadgeCount` returns `0` when hidden)
- [x] T007 Implement item removal in `pages/cart.page.ts` (`removeItemByName`) with deterministic wait for row updates
- [x] T008 Implement cart action methods in `pages/cart.page.ts` (`clickContinueShopping`, `clickCheckout`)
- [x] T009 Extend fixtures in `fixtures/index.ts` to inject typed `cartPage` fixture
- [x] T010 Add/confirm cart route constants in `utils/routes.ts` (`ROUTES.CART`, `ROUTES.CHECKOUT_STEP_ONE`)

**Checkpoint**: Foundation complete; user stories can proceed.

---

## Phase 3: User Story 1 — Cart Item Display (Priority: P1) MVP

**Goal**: Verify cart shows exactly the items added, each with name, description, and price.

**Independent Test**: Run US1 tests in `tests/e2e/cart.spec.ts` and validate 1-item and 3-item display with full row details.

### Tests for User Story 1

- [x] T011 [P] [US1] Initialize `tests/e2e/cart.spec.ts` with fixture-only imports and no `test.use(...)` override
- [x] T012 [US1] Add test in `tests/e2e/cart.spec.ts` for one added product -> exactly one cart row + badge count match
- [x] T013 [US1] Add test in `tests/e2e/cart.spec.ts` for three added products -> exactly three cart rows + badge count match
- [x] T014 [US1] Add row-content test in `tests/e2e/cart.spec.ts` asserting each cart row includes name, description, and price

### Implementation for User Story 1

- [x] T015 [US1] Add in-test setup helper(s) in `tests/e2e/cart.spec.ts` to add items fresh per test body via `inventoryPage`

**Checkpoint**: US1 is independently testable and passable.

---

## Phase 4: User Story 2 — Cart Item Removal (Priority: P2)

**Goal**: Verify removing items updates rows and badge count correctly, including empty-cart behavior.

**Independent Test**: Run US2 tests in `tests/e2e/cart.spec.ts` and validate decrement-by-1 and empty-cart badge hidden behavior.

### Tests for User Story 2

- [x] T016 [P] [US2] Add test in `tests/e2e/cart.spec.ts` removing one of two items -> row removed and badge decrements from 2 to 1
- [x] T017 [US2] Add test in `tests/e2e/cart.spec.ts` removing last remaining item -> cart rows empty and badge count interpreted as 0
- [x] T018 [US2] Add assertion coverage in `tests/e2e/cart.spec.ts` that removed item is absent from cart item names after removal

### Implementation for User Story 2

- [x] T019 [US2] Harden `removeItemByName` in `pages/cart.page.ts` to reliably target product-specific remove button and wait for DOM stability

**Checkpoint**: US1 and US2 both pass independently.

---

## Phase 5: User Story 3 — Cart Persistence Across Navigation (Priority: P3)

**Goal**: Verify cart contents persist when navigating away and returning in the same session.

**Independent Test**: Run US3 tests in `tests/e2e/cart.spec.ts` and validate item names and badge count remain unchanged after away-and-return.

### Tests for User Story 3

- [x] T020 [P] [US3] Add inventory-away-and-return persistence test in `tests/e2e/cart.spec.ts` (cart -> inventory -> cart)
- [x] T021 [US3] Add product-detail-away-and-return persistence test in `tests/e2e/cart.spec.ts` (cart -> detail -> cart)
- [x] T022 [US3] Add assertions in `tests/e2e/cart.spec.ts` comparing baseline and post-return item names and badge count

### Implementation for User Story 3

- [x] T023 [US3] Add deterministic comparison helper(s) in `tests/e2e/cart.spec.ts` for stable item-set equality across navigation

**Checkpoint**: US3 passes independently.

---

## Phase 6: User Story 4 — Cart Page Actions (Priority: P4)

**Goal**: Verify cart action buttons route to the correct destinations.

**Independent Test**: Run US4 tests in `tests/e2e/cart.spec.ts` and validate `Continue Shopping` -> inventory and `Checkout` -> step one.

### Tests for User Story 4

- [x] T024 [P] [US4] Add `Continue Shopping` navigation test in `tests/e2e/cart.spec.ts` asserting `/inventory.html`
- [x] T025 [US4] Add `Checkout` navigation test in `tests/e2e/cart.spec.ts` asserting `/checkout-step-one.html`

### Implementation for User Story 4

- [x] T026 [US4] Verify action methods in `pages/cart.page.ts` are used exclusively by tests (no direct selectors in `tests/e2e/cart.spec.ts`)

**Checkpoint**: All four user stories pass independently.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Final quality gates and constitution checks.

- [x] T027 [P] Run lint and resolve findings (`npm run lint`)
- [x] T028 [P] Run type-check and resolve findings (`npx tsc --noEmit`)
- [x] T029 Run cart suite across all browsers (`npx playwright test tests/e2e/cart.spec.ts --project=chromium --project=firefox --project=webkit`)
- [x] T030 Validate constitution commands from `specs/003-shopping-cart/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) starts immediately
- Foundational (Phase 2) depends on Setup and blocks all user stories
- User stories (Phases 3-6) depend on Foundational completion
- Polish (Phase 7) depends on completion of desired user stories

### User Story Dependencies

- US1 (P1) starts after Phase 2
- US2 (P2) starts after Phase 2 and is independent of US3/US4
- US3 (P3) starts after Phase 2 and is independent of US4
- US4 (P4) starts after Phase 2 and is independent of US3

### Within Each User Story

- Write tests first and confirm they fail before implementation
- Keep item setup inside each test body (no shared mutable cart state)
- Complete story-specific assertions before moving to the next priority

---

## Parallel Opportunities

- T002 and T003 can run in parallel (different config files)
- T005 and T006 can run in parallel (independent cart read methods)
- T016 and T017 can run in parallel (separate removal scenarios)
- T027 and T028 can run in parallel after implementation is complete

---

## Parallel Example: User Story 2

```bash
# Removal scenarios can be implemented independently:
Task T016: remove one-of-two and assert badge decrement in tests/e2e/cart.spec.ts
Task T017: remove last item and assert empty cart + badge=0 in tests/e2e/cart.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phases 1-2
2. Complete Phase 3 (US1)
3. Validate cart display independently
4. Demo baseline cart visibility behavior

### Incremental Delivery

1. Foundation complete (Phases 1-2)
2. Deliver US1 (display)
3. Add US2 (removal)
4. Add US3 (persistence)
5. Add US4 (cart actions)
6. Run Phase 7 quality gates

### Parallel Team Strategy

1. Engineer A: `pages/cart.page.ts` foundation (T004-T008, T019)
2. Engineer B: fixture + route wiring (T009-T010)
3. Engineer C: `tests/e2e/cart.spec.ts` by story slices (T011-T018, T020-T025)
4. Team: quality gates and compliance checks (T027-T030)

---

## Notes

- `[P]` marks tasks suitable for parallel execution when dependencies permit
- Keep selectors in page objects only (`pages/`), never in test files
- Import `test`/`expect` only from fixtures (`@fixtures` / `fixtures/index.ts`)
- Preserve test isolation by adding items fresh in each test body
