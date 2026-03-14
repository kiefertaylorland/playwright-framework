# Research: Shopping Cart — SauceDemo

**Feature**: 003-shopping-cart
**Date**: 2026-03-13
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Dedicated `CartPage` for all cart interactions

**Decision**: Implement `pages/cart.page.ts` as the single owner of cart-page
selectors and interactions: item list reads, item removal, badge reads, and cart
exit actions.

**Rationale**: A dedicated page object keeps cart logic decoupled from inventory
logic and preserves Principle II boundaries.

**Alternatives considered**:
- Add cart methods to `InventoryPage`: rejected because cart is a distinct page.
- Keep selectors in tests: rejected by Constitution Principle II.

---

## Decision 2: Default storage state only (no override)

**Decision**: `cart.spec.ts` inherits `.auth/standard-user.json` from
`playwright.config.ts` and does not call `test.use(...)`.

**Rationale**: Shopping cart scenarios are authenticated flows and should use the
same default setup as other authenticated UI suites.

---

## Decision 3: Per-test fresh item setup in test body

**Decision**: Every test adds required products inside its own test body before
navigating to cart.

**Rationale**: This was explicitly required and enforces Principle III test
isolation. No shared `beforeEach` cart mutation is used.

**Alternatives considered**:
- Shared setup hook adding common items: introduces hidden cross-test coupling.
- Pre-populated cart in storage state: brittle and non-isolated.

---

## Decision 4: Cart count assertions are badge-driven

**Decision**: Verify cart item count by reading the DOM cart badge value
(`data-test="shopping-cart-badge"`) and parsing it as an integer.

**Rationale**: The badge is SauceDemo’s canonical cart count indicator and aligns
with the feature requirement to verify count from DOM badge text.

**Implementation note**: when no badge is rendered, count is treated as `0`.

---

## Decision 5: Cart row verification uses item details from cart DOM

**Decision**: Cart item display assertions read name, description, and price from
cart page DOM elements and assert expected rows are present.

**Rationale**: FR-001/FR-002 require full row detail verification, not just badge
count checks.

---

## Decision 6: Remove actions and decrement behavior

**Decision**: Remove actions are executed through `CartPage.removeItemByName(name)`
and verified by:
1. removed item no longer in cart rows,
2. badge decremented by exactly 1,
3. badge hidden when cart becomes empty.

**Rationale**: This directly maps to FR-004 through FR-007.

---

## Decision 7: Persistence flow is navigation away + return

**Decision**: Persistence test path:
1. add items,
2. open cart and capture item names,
3. navigate away to inventory (`Continue Shopping` or direct inventory route),
4. return to cart,
5. assert the same item set remains.

**Rationale**: Matches the requested "navigate away and return" verification and
US3 acceptance criteria.

---

## Decision 8: Fixture-only imports are enforced

**Decision**: All tests import `test` and `expect` from `fixtures/index.ts`
(alias `@fixtures`) and never from `@playwright/test` directly.

**Rationale**: Principle VII is non-negotiable and ensures shared fixture context
is always applied.

**Verification rule**:
`grep -r "from '@playwright/test'" tests/` must return no results.
