# Tasks: Checkout Flow — SauceDemo

**Input**: Design documents from `/specs/004-checkout-flow/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: This feature explicitly requires automated Playwright coverage for all user stories.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare checkout-feature scaffolding and prerequisites.

- [x] T001 Create feature file scaffolding: `pages/checkout.page.ts` and `tests/e2e/checkout.spec.ts`
- [x] T002 [P] Confirm authenticated defaults in `playwright.config.ts` (`storageState: '.auth/standard-user.json'` remains default)
- [x] T003 [P] Confirm fixture import path support in `tsconfig.json` (`@fixtures` alias)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared checkout page-object and fixture plumbing required by all stories.

**CRITICAL**: No user-story work starts before this phase is complete.

- [x] T004 Implement cart-entry and step-route helpers in `pages/checkout.page.ts` (`startCheckoutFromCart`, `isOnStepOne`, `isOnStepTwo`, `isOnCompleteStep`)
- [x] T005 Implement step 1 form interactions in `pages/checkout.page.ts` (`fillFirstName`, `fillLastName`, `fillPostalCode`, `continueFromStepOne`, `cancelFromStepOne`, `completeStepOne`, `getStepOneErrorMessage`)
- [x] T006 Implement step 2 interactions in `pages/checkout.page.ts` (`getSummaryItemNames`, `getSummaryItemPrices`, `getDisplayedItemTotal`, `getDisplayedTax`, `getDisplayedTotal`, `finishCheckout`, `cancelFromStepTwo`)
- [x] T007 Implement step 3 confirmation helper in `pages/checkout.page.ts` (`getConfirmationHeader`)
- [x] T008 Implement money parser helper in `pages/checkout.page.ts` (DOM text -> number using `parseFloat(text.replace(/[^0-9.]/g, ''))`)
- [x] T009 Extend fixtures in `fixtures/index.ts` to inject typed `checkoutPage` fixture
- [x] T010 Add/confirm checkout route constants in `utils/routes.ts` (`CART`, `CHECKOUT_STEP_ONE`, `CHECKOUT_STEP_TWO`, `CHECKOUT_COMPLETE`)

**Checkpoint**: Foundation complete; user stories can proceed.

---

## Phase 3: User Story 1 — End-to-End Happy Path (Priority: P1) MVP

**Goal**: Verify full 3-step checkout completion and confirmation message.

**Independent Test**: Run US1 test in `tests/e2e/checkout.spec.ts` and confirm step1 -> step2 -> step3 with success message.

### Tests for User Story 1

- [x] T011 [P] [US1] Initialize `tests/e2e/checkout.spec.ts` with fixture-only imports and no `test.use(...)` override
- [x] T012 [US1] Add happy-path checkout test in `tests/e2e/checkout.spec.ts` (cart setup in test body -> step 1 -> step 2 -> finish -> confirmation)
- [x] T013 [US1] Add assertion in `tests/e2e/checkout.spec.ts` for exact confirmation text `Thank you for your order!`

### Implementation for User Story 1

- [x] T014 [US1] Add in-test setup helper(s) in `tests/e2e/checkout.spec.ts` to add required item(s) fresh in each test body via `inventoryPage`

**Checkpoint**: US1 is independently testable and passable.

---

## Phase 4: User Story 2 — Step 1 Form Validation (Priority: P2)

**Goal**: Verify each required field on step 1 produces exact error text when missing.

**Independent Test**: Run US2 tests in `tests/e2e/checkout.spec.ts` and verify exact step 1 errors while remaining on step 1.

### Tests for User Story 2

- [x] T015 [P] [US2] Add first-name-required test in `tests/e2e/checkout.spec.ts` asserting `Error: First Name is required`
- [x] T016 [P] [US2] Add last-name-required test in `tests/e2e/checkout.spec.ts` asserting `Error: Last Name is required`
- [x] T017 [P] [US2] Add postal-code-required test in `tests/e2e/checkout.spec.ts` asserting `Error: Postal Code is required`
- [x] T018 [US2] Add assertions in each US2 test that URL remains `/checkout-step-one.html`

### Implementation for User Story 2

- [x] T019 [US2] Add/confirm step 1 error constants in `pages/checkout.page.ts` (or constants module) matching exact contract strings

**Checkpoint**: US1 and US2 both pass independently.

---

## Phase 5: User Story 3 — Step 2 Order Summary Accuracy (Priority: P3)

**Goal**: Verify two-item summary accuracy and DOM-driven monetary relationships.

**Independent Test**: Run US3 test in `tests/e2e/checkout.spec.ts` and verify item list plus item-total/tax/total arithmetic from DOM values only.

### Tests for User Story 3

- [x] T020 [P] [US3] Add summary-item test in `tests/e2e/checkout.spec.ts` that adds exactly `Sauce Labs Backpack` and `Sauce Labs Bike Light` fresh in test body and asserts exactly those two names on step 2
- [x] T021 [US3] Add item-total assertion in `tests/e2e/checkout.spec.ts`: sum parsed row prices equals parsed displayed `Item total` via `toFixed(2)`
- [x] T022 [US3] Add tax assertion in `tests/e2e/checkout.spec.ts`: parsed displayed `Tax` is non-zero
- [x] T023 [US3] Add grand-total assertion in `tests/e2e/checkout.spec.ts`: `(itemTotal + tax).toFixed(2) === total.toFixed(2)`

### Implementation for User Story 3

- [x] T024 [US3] Ensure all monetary reads in `pages/checkout.page.ts` parse displayed DOM strings only (no independent tax-rate calculation)

**Checkpoint**: US3 passes independently and conforms to DOM-driven math constraints.

---

## Phase 6: User Story 4 — Cancel Navigation (Priority: P4)

**Goal**: Verify cancel destinations are step-specific.

**Independent Test**: Run US4 tests in `tests/e2e/checkout.spec.ts` and verify step1 cancel -> cart, step2 cancel -> inventory.

### Tests for User Story 4

- [x] T025 [P] [US4] Add step-1 cancel test in `tests/e2e/checkout.spec.ts` asserting `/cart.html`
- [x] T026 [US4] Add step-2 cancel test in `tests/e2e/checkout.spec.ts` asserting `/inventory.html`

### Implementation for User Story 4

- [x] T027 [US4] Verify cancel methods in `pages/checkout.page.ts` are used exclusively by tests (no direct selectors in `tests/e2e/checkout.spec.ts`)

**Checkpoint**: All four user stories pass independently.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Final quality gates and constitution checks.

- [x] T028 [P] Run lint and resolve findings (`npm run lint`)
- [x] T029 [P] Run type-check and resolve findings (`npx tsc --noEmit`)
- [x] T030 Run checkout suite across all browsers (`npx playwright test tests/e2e/checkout.spec.ts --project=chromium --project=firefox --project=webkit`)
- [x] T031 Validate constitution commands from `specs/004-checkout-flow/quickstart.md`

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
- Keep monetary assertions DOM-driven for US3
- Complete story-specific assertions before moving to next priority

---

## Parallel Opportunities

- T002 and T003 can run in parallel (different config concerns)
- T005 and T006 can run in parallel (step 1 vs step 2 page-object methods)
- T015-T017 can run in parallel (separate validation scenarios)
- T028 and T029 can run in parallel after implementation completes

---

## Parallel Example: User Story 2

```bash
# Step-1 validation scenarios can be implemented independently:
Task T015: first-name-required test in tests/e2e/checkout.spec.ts
Task T016: last-name-required test in tests/e2e/checkout.spec.ts
Task T017: postal-code-required test in tests/e2e/checkout.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phases 1-2
2. Complete Phase 3 (US1)
3. Validate full happy-path checkout independently
4. Demo baseline 3-step purchase flow

### Incremental Delivery

1. Foundation complete (Phases 1-2)
2. Deliver US1 (happy path)
3. Add US2 (step 1 validation)
4. Add US3 (order summary math)
5. Add US4 (cancel paths)
6. Run Phase 7 quality gates

### Parallel Team Strategy

1. Engineer A: `pages/checkout.page.ts` methods and parsing (T004-T008, T024, T027)
2. Engineer B: fixture and route wiring (T009-T010)
3. Engineer C: `tests/e2e/checkout.spec.ts` by user-story slices (T011-T023, T025-T026)
4. Team: lint/type/test/compliance gates (T028-T031)

---

## Notes

- `[P]` marks tasks suitable for parallel execution when dependencies permit
- Keep selectors in page objects only (`pages/`), never in test files
- Import `test`/`expect` only from fixtures (`@fixtures` / `fixtures/index.ts`)
- Preserve isolation by adding required items fresh in each test body
- US3 monetary checks must parse displayed DOM strings only and avoid tax-rate formulas
