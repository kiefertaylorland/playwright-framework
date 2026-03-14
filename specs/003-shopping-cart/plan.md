# Implementation Plan: Shopping Cart — SauceDemo

**Branch**: `003-shopping-cart` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-shopping-cart/spec.md`

## Summary

Implement end-to-end shopping cart coverage for SauceDemo: cart item display,
item removal with badge decrement, cart persistence across navigation, and cart
page exit actions (`Continue Shopping` and `Checkout`).

This feature introduces a dedicated `CartPage` Page Object (`pages/cart.page.ts`)
and keeps test setup fully isolated: each test adds items fresh inside its own
test body, uses the default authenticated storage state, and verifies item count
through the DOM cart badge value.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict: true`, `noImplicitAny: true`
**Primary Dependencies**: `@playwright/test`, `allure-playwright`,
  `eslint`, `@typescript-eslint/eslint-plugin`
**Storage**: `.auth/standard-user.json` — loaded as default `storageState`
  from `playwright.config.ts` (no `test.use()` override in this feature)
**Testing**: `@playwright/test` native runner; 3 browser projects: chromium,
  firefox, webkit; `fullyParallel: true`; `retries: 1` in CI
**Target Platform**: Web application — `https://www.saucedemo.com`
**Project Type**: E2E UI test suite (Page Object Model)
**Performance Goals**: Full cart suite (3 browsers) completes in < 60s on CI
**Constraints**: Same stack conventions as 001; cart interactions encapsulated in
  `pages/cart.page.ts`; tests inherit default storageState; each test adds items
  fresh in test body (no shared cart setup state); item count assertions read DOM
  badge value; persistence test navigates away and returns to verify items remain;
  all tests import `{ test, expect }` from `fixtures/index.ts`, never directly
  from `@playwright/test`
**Scale/Scope**: 7 test scenarios, 1 test file, 1 new Page Object class,
  1 fixture extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Strict TypeScript | ✅ Pass | Typed `CartItem` and `ICartPage` interfaces; no `any` |
| II. Page Object Model | ✅ Pass | `CartPage` and existing `InventoryPage` own all selectors; tests stay selector-free |
| III. Test Isolation | ✅ Pass | Each test adds items fresh in test body; no shared cart state between tests |
| IV. Selector Hierarchy | ⚠️ Justified | SauceDemo provides `data-test` (not `data-testid`) attributes |
| V. Secrets Management | ✅ Pass | No new credentials; existing env-based auth is reused |
| VI. Parallel-Safe Design | ✅ Pass | Default storageState is read-only; per-test browser contexts isolate cart state |
| VII. Fixture Imports | ✅ Pass | All tests import from `@fixtures` / `fixtures/index.ts` only |
| VIII. API Test Purity | ✅ Exempt | UI feature only |

**All gates pass. One Principle IV deviation is documented in Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/003-shopping-cart/
├── plan.md                 # This file
├── research.md             # Phase 0 — 8 architectural decisions
├── data-model.md           # Phase 1 — CartPage interface and selector model
├── quickstart.md           # Phase 1 — setup, run commands, troubleshooting
├── contracts/
│   ├── cart-page.md        # Display, removal, badge, and cart actions contracts
│   └── cart-persistence.md # Away-and-return persistence contract
└── tasks.md                # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
pages/
├── cart.page.ts            # NEW: cart display, remove, badge, continue, checkout
└── inventory.page.ts       # Existing from 002; used to add products in test bodies

tests/
└── e2e/
    └── cart.spec.ts        # US1 display, US2 removal, US3 persistence, US4 actions
                            # Uses default storageState (no test.use override)

fixtures/
└── index.ts                # Extend with CartPage fixture

utils/
└── routes.ts               # Add/confirm CART + CHECKOUT_STEP_ONE route constants

# Unchanged from 001:
global-setup.ts             # Produces .auth/standard-user.json
playwright.config.ts        # Default storageState + browser projects
```

**Structure Decision**: Single-project root structure, consistent with features
001 and 002. `CartPage` owns cart-specific selectors while `InventoryPage`
provides deterministic per-test item setup. Tests intentionally avoid shared cart
state setup and add items explicitly in each test body.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principle IV: `data-test` instead of `data-testid` | SauceDemo is a third-party app and exposes `data-test` for stable test selectors | We cannot add `data-testid` to third-party DOM; `data-test` is equivalent for stability |

---

## Phase 0: Research Summary

All 8 decisions are documented in [research.md](research.md). No
NEEDS CLARIFICATION items remain.

Key decisions:
1. **Single CartPage strategy** — one Page Object for cart display/removal/actions
2. **Default auth state inheritance** — no `test.use` override in cart tests
3. **Isolation strategy** — each test adds items fresh in its own test body
4. **Badge count strategy** — item count assertions use DOM badge value
5. **Removal selector strategy** — remove buttons handled inside `CartPage`
6. **Persistence strategy** — navigate away to inventory and return to cart
7. **Navigation action strategy** — continue shopping and checkout destination checks
8. **Fixture import enforcement** — tests import from fixtures only

## Phase 1: Design Summary

Artifacts generated:
- **[data-model.md](data-model.md)**: TypeScript interfaces for `ICartPage`,
  `CartItem`, selector inventory, and badge parsing contract.
- **[contracts/cart-page.md](contracts/cart-page.md)**: Cart item display,
  remove/badge decrement, empty-cart badge behavior, and action button routing.
- **[contracts/cart-persistence.md](contracts/cart-persistence.md)**:
  away-and-return persistence flow and expected invariants.
- **[quickstart.md](quickstart.md)**: Setup and run guide, expected output,
  constitution checks, and troubleshooting.

## Post-Phase 1 Constitution Re-check

All principles continue to pass after design.

- Principle III is enforced by explicit in-test item setup and no shared cart state.
- Principle VII is enforced by fixture-only imports in all test files.
- Principle IV deviation remains constrained to SauceDemo `data-test` selectors
  contained within Page Objects.

**Dependency note**: This feature depends on 001 for authenticated storage state
and 002 for inventory add-to-cart interactions used during per-test setup.
