# Research: Checkout Flow — SauceDemo

**Feature**: 004-checkout-flow
**Date**: 2026-03-13
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Single Page Object for all 3 checkout steps

**Decision**: Implement `pages/checkout.page.ts` as the single Page Object for:
- cart entry action (`Checkout` button on `/cart.html`)
- step 1 (`/checkout-step-one.html`)
- step 2 (`/checkout-step-two.html`)
- step 3 (`/checkout-complete.html`)

**Rationale**: The user requirement explicitly asks for one CheckoutPage covering
all 3 steps. Keeping step transitions and summary parsing in one class prevents
flow logic from being split across multiple files and preserves a clean test API.

**Alternatives considered**:
- Separate `CheckoutStepOnePage`, `CheckoutStepTwoPage`, `CheckoutCompletePage`:
  more granular but unnecessary overhead for one tightly coupled flow.
- Reusing CartPage for step-1 entry only: still requires a new checkout class for
  steps 1-3 and fragments the feature contract.

---

## Decision 2: Auth state inheritance (no overrides)

**Decision**: Checkout tests use the global default
`.auth/standard-user.json` storage state and do not call
`test.use({ storageState: undefined })`.

**Rationale**: Checkout is an authenticated flow by definition. Reusing the
existing default storage state from 001 keeps startup fast and avoids redundant
login steps.

**Constitution impact**: Principle III remains satisfied because Playwright creates
an isolated browser context per test from the same read-only storage snapshot.

---

## Decision 3: Cart setup must happen inside each test body

**Decision**: Each checkout test adds required items fresh in its own test body
before starting checkout.

**Rationale**: This is explicitly required by the feature input and enforces strict
isolation. No shared `beforeEach` cart mutation will be used for this feature.

**Alternatives considered**:
- Shared `beforeEach` item setup: less repetition but introduces hidden mutable
  state and makes test intent less explicit.
- Pre-seeded cart in storage state: violates isolation and can become stale.

---

## Decision 4: Step 1 validation strings are exact-match assertions

**Decision**: Assert exact step 1 errors:
- `Error: First Name is required`
- `Error: Last Name is required`
- `Error: Postal Code is required`

**Rationale**: FR-002/003/004 require field-targeted validation with exact text.
Exact-match assertions prevent false positives from partial string checks.

---

## Decision 5: Order summary test uses exactly two named products

**Decision**: The step 2 money test will always add:
- `Sauce Labs Backpack` (`$29.99`)
- `Sauce Labs Bike Light` (`$9.99`)

**Rationale**: This is a clarified requirement in the spec. Limiting to two stable
products keeps arithmetic deterministic and assertions easy to diagnose.

**Implementation note**: Item names are asserted from the summary DOM to ensure the
line items are exactly these two and no extras are present.

---

## Decision 6: Monetary assertions are DOM-driven only

**Decision**: All money values are parsed from displayed strings on step 2:
item row prices, `Item total`, `Tax`, and `Total`.

**Rationale**: The feature explicitly forbids independent tax-rate calculations.
DOM-driven checks avoid mismatches caused by rounding strategy differences between
test logic and app logic.

**Alternatives considered**:
- Hard-coding tax percentages and recomputing expected tax: rejected by spec.
- Hard-coding full expected grand total: brittle when tax display changes.

---

## Decision 7: Grand total contract uses `toFixed(2)` equality

**Decision**: Enforce grand total as:
`(itemTotal + tax).toFixed(2) === total.toFixed(2)`
where all three operands are parsed from displayed DOM strings.

**Rationale**: JavaScript floating-point arithmetic can introduce tiny precision
noise. Comparing two-decimal string representations aligns with currency display
precision and the clarified feature requirement.

---

## Decision 8: Cancel destination is step-specific

**Decision**:
- Cancel on step 1 returns `/cart.html`
- Cancel on step 2 returns `/inventory.html`

**Rationale**: The spec clarification confirms SauceDemo's step-2 cancel behaviour
is intentionally inventory-directed, not cart-directed.

**Testing rule**: These are asserted in separate tests so each path is explicit
and independently diagnosable.
