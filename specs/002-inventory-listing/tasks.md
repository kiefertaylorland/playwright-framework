# Tasks: Inventory Page — Product Listing

**Input**: Design documents from `/specs/002-inventory-listing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: This feature explicitly requires automated Playwright coverage for all user stories.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare inventory-feature files and test scaffold.

- [x] T001 Create feature file scaffolding: `tests/e2e/inventory.spec.ts` and `pages/product-detail.page.ts`
- [x] T002 [P] Confirm path aliases and exports needed by this feature in `tsconfig.json` and `fixtures/index.ts`
- [x] T003 [P] Verify authenticated prerequisite usage in `playwright.config.ts` (`storageState: '.auth/standard-user.json'` remains default)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core page-object and fixture infrastructure required by all inventory user stories.

**CRITICAL**: No user-story implementation starts before this phase is complete.

- [x] T004 Scaffold method **signatures and stubs** in `pages/inventory.page.ts` for all inventory-specific methods (`sortBy`, `getProductCount`, `getDescriptionCount`, `getAddToCartButtonCount`, `getProductNames`, `getProductPrices`, `clickProductByName`, `clickFirstProduct`, `addProductToCartByIndex`, `getCartBadgeCount`) — stubs throw `new Error('not implemented')`; full implementations land in Phases 3–6; 001 methods preserved unchanged
- [x] T005 Implement sort option constants/type in `pages/inventory.page.ts` (or shared typed module) matching values `az`, `za`, `lohi`, `hilo`
- [x] T006 Implement minimal detail page object in `pages/product-detail.page.ts` (`isOnDetailPage`, `goBack`)
- [x] T007 Extend fixture wiring in `fixtures/index.ts` to inject `productDetailPage` alongside existing `loginPage` and `inventoryPage`
- [x] T008 Add/confirm detail route constant support in `utils/routes.ts` (e.g., `ROUTES.INVENTORY_ITEM`) for URL assertions

**Checkpoint**: Foundation complete; user stories can now proceed.

---

## Phase 3: User Story 1 — Product Catalogue Display (Priority: P1) MVP

**Goal**: Verify inventory renders exactly 6 products with full required structure.

**Independent Test**: Run only US1 tests in `tests/e2e/inventory.spec.ts` and verify 6-card catalogue + required elements.

### Tests for User Story 1

- [x] T009 [P] [US1] Populate `tests/e2e/inventory.spec.ts` (created in T001) with fixture-only imports (`@fixtures`) and confirm default storageState usage — no test bodies yet
- [x] T010 [US1] Add test in `tests/e2e/inventory.spec.ts` asserting `getProductCount()` returns `6`
- [x] T011 [US1] Add structural parity test in `tests/e2e/inventory.spec.ts` asserting `getDescriptionCount() === getProductCount()` and `getAddToCartButtonCount() === getProductCount()`

### Implementation for User Story 1

- [x] T012 [US1] Implement/complete US1 structural count helpers in `pages/inventory.page.ts`: `getProductCount()` via `.inventory_item`, `getDescriptionCount()` via `.inventory_item_desc`, `getAddToCartButtonCount()` via `[data-test^=\"add-to-cart\"]`

**Checkpoint**: US1 is independently testable and passable.

---

## Phase 4: User Story 2 — Product Sorting (Priority: P2)

**Goal**: Verify all four sort options exist and reorder catalogue correctly.

**Independent Test**: Run only sorting tests in `tests/e2e/inventory.spec.ts` and verify A-Z, Z-A, low-high, high-low behavior.

### Tests for User Story 2

- [x] T013 [P] [US2] Add sort-dropdown-options test in `tests/e2e/inventory.spec.ts` (4 options with expected labels/values)
- [x] T014 [P] [US2] Add Name (A to Z) ordering test in `tests/e2e/inventory.spec.ts`
- [x] T015 [P] [US2] Add Name (Z to A) ordering test in `tests/e2e/inventory.spec.ts`
- [x] T016 [P] [US2] Add Price (low to high) ordering test in `tests/e2e/inventory.spec.ts`
- [x] T017 [P] [US2] Add Price (high to low) ordering test in `tests/e2e/inventory.spec.ts`

### Implementation for User Story 2

- [x] T018 [US2] Implement `sortBy()` behavior in `pages/inventory.page.ts` with stable wait for post-sort DOM update
- [x] T019 [US2] Implement `getProductNames()` and `getProductPrices()` in `pages/inventory.page.ts`, including `$` stripping + `parseFloat` price parsing

**Checkpoint**: US1 and US2 both pass independently.

---

## Phase 5: User Story 3 — Product Detail Navigation (Priority: P3)

**Goal**: Verify click-through from inventory to detail page and back-navigation to inventory.

**Independent Test**: Run only detail-navigation tests in `tests/e2e/inventory.spec.ts` and verify URL transitions.

### Tests for User Story 3

- [x] T020 [P] [US3] Add inventory-to-detail navigation test in `tests/e2e/inventory.spec.ts` using `clickFirstProduct()` or `clickProductByName()`
- [x] T021 [US3] Add back-to-inventory test in `tests/e2e/inventory.spec.ts` using `ProductDetailPage.goBack()`

### Implementation for User Story 3

- [x] T022 [US3] Implement `clickProductByName()` and `clickFirstProduct()` in `pages/inventory.page.ts`
- [x] T023 [US3] Implement `isOnDetailPage()` and `goBack()` in `pages/product-detail.page.ts`

**Checkpoint**: US3 passes independently with no dependency on cart tests.

---

## Phase 6: User Story 4 — Cart Badge Counter (Priority: P4)

**Goal**: Verify cart badge increments correctly after sequential add-to-cart actions.

**Independent Test**: Run only cart-badge tests in `tests/e2e/inventory.spec.ts` and verify badge `1` then `2`.

### Tests for User Story 4

- [x] T024 [P] [US4] Add cart-badge increment test for first add in `tests/e2e/inventory.spec.ts` — assert badge displays "1"
- [x] T025 [US4] Add cart-badge increment test for second add in `tests/e2e/inventory.spec.ts` — assert badge displays "2"
- [x] T025b [US4] Add cart-badge increment test for third add in `tests/e2e/inventory.spec.ts` — assert badge displays "3" (satisfies SC-005: "sequences of 1 through at least 3 additions")

### Implementation for User Story 4

- [x] T026 [US4] Implement `addProductToCartByIndex()` in `pages/inventory.page.ts` using page-object owned selectors only
- [x] T027 [US4] Implement `getCartBadgeCount()` in `pages/inventory.page.ts` returning badge text or `null` when hidden

**Checkpoint**: All four user stories pass independently.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Final validation and constitution compliance checks.

- [x] T028 [P] Run lint and address findings (`npm run lint`)
- [x] T029 [P] Run type-check and address findings (`npx tsc --noEmit`)
- [x] T030 Run inventory suite across all browsers (`npx playwright test tests/e2e/inventory.spec.ts --project=chromium --project=firefox --project=webkit`)
- [x] T031 Validate constitution guard commands from `specs/002-inventory-listing/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) starts immediately
- Foundational (Phase 2) depends on Setup and blocks all user stories
- User stories (Phases 3-6) depend on Foundational completion
- Polish (Phase 7) depends on completion of desired user stories

### User Story Dependencies

- US1 (P1) can start after Phase 2
- US2 (P2) can start after Phase 2 and is independent of US3/US4
- US3 (P3) can start after Phase 2 and is independent of US4
- US4 (P4) can start after Phase 2 and is independent of US3

### Within Each User Story

- Write tests first and confirm they fail before implementation
- Implement page-object behavior before finalizing dependent assertions
- Complete story-specific validation before moving to next priority

---

## Parallel Opportunities

- T002 and T003 can run in parallel (different config concerns)
- T004 and T006 can run in parallel (different page object files)
- T013–T017 can run in parallel (sorting test cases)
- T028 and T029 can run in parallel after implementation completes

---

## Parallel Example: User Story 2

```bash
# Sorting coverage can be split and merged:
Task T013: sort-dropdown-options test in tests/e2e/inventory.spec.ts
Task T014: A-Z name sort test in tests/e2e/inventory.spec.ts
Task T015: Z-A name sort test in tests/e2e/inventory.spec.ts
Task T016: low-high price sort test in tests/e2e/inventory.spec.ts
Task T017: high-low price sort test in tests/e2e/inventory.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phases 1-2
2. Complete Phase 3 (US1)
3. Validate inventory catalogue rendering independently
4. Demo/deploy baseline inventory visibility

### Incremental Delivery

1. Foundation complete (Phases 1-2)
2. Deliver US1 (catalogue display)
3. Add US2 (sorting)
4. Add US3 (detail navigation)
5. Add US4 (cart badge)
6. Run Phase 7 quality gates

### Parallel Team Strategy

1. Engineer A: extend `pages/inventory.page.ts` (T004, T005, T018, T019, T026, T027)
2. Engineer B: implement `pages/product-detail.page.ts` + fixture wiring (T006, T007, T023)
3. Engineer C: implement `tests/e2e/inventory.spec.ts` by user-story slices (T009-T011, T013-T017, T020-T021, T024-T025)
4. Converge on lint/type/test/compliance gates (T028-T031)

---

## Notes

- `[P]` denotes tasks safe for parallel execution when dependencies permit
- Keep all selectors inside page objects (`pages/`), never in test files
- Import `test`/`expect` only from fixtures (`@fixtures`)
- Preserve 001 auth-scoped `InventoryPage` methods; extend, do not break
- Keep cart state isolation implicit via per-test context and default storageState
