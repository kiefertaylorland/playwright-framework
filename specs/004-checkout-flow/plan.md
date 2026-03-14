# Implementation Plan: Checkout Flow — SauceDemo

**Branch**: `004-checkout-flow` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-checkout-flow/spec.md`

## Summary

Implement end-to-end checkout coverage for SauceDemo's 3-step checkout funnel:
step 1 personal info form, step 2 order summary with DOM-driven monetary math,
and step 3 confirmation message.

This feature adds a dedicated `CheckoutPage` Page Object (`pages/checkout.page.ts`)
that owns selectors and interactions across all checkout steps. Tests use the
existing default authenticated storage state and always add cart items fresh
inside each test body to keep isolation strict.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict: true`, `noImplicitAny: true`
**Primary Dependencies**: `@playwright/test`, `allure-playwright`,
  `eslint`, `@typescript-eslint/eslint-plugin`
**Storage**: `.auth/standard-user.json` — loaded as default `storageState`
  (no `test.use()` overrides in this feature)
**Testing**: `@playwright/test` native runner; 3 browser projects: chromium,
  firefox, webkit; `fullyParallel: true`; `retries: 1` in CI
**Target Platform**: Web application — `https://www.saucedemo.com`
**Project Type**: E2E UI test suite (Page Object Model)
**Performance Goals**: Full checkout suite (3 browsers) completes in < 60s on CI
**Constraints**: `pages/checkout.page.ts` must cover all 3 checkout steps;
  tests inherit default storageState; order summary math test uses exactly
  "Sauce Labs Backpack" + "Sauce Labs Bike Light"; all monetary assertions parse
  displayed DOM strings only; no independent tax rate calculation; grand total is
  asserted as `(itemTotal + tax).toFixed(2) === total.toFixed(2)`; items are
  added fresh inside each test body
**Scale/Scope**: 7 test scenarios, 1 test file, 1 new Page Object class,
  1 fixture extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Strict TypeScript | ✅ Pass | `strict: true`; no `any`; typed `CheckoutInfo` and money parsing helpers |
| II. Page Object Model | ✅ Pass | `CheckoutPage` owns all checkout selectors; test files remain selector-free |
| III. Test Isolation | ✅ Pass | Every test adds required items fresh in test body; no shared cart setup hooks |
| IV. Selector Hierarchy | ⚠️ Justified | SauceDemo uses `data-test` (not `data-testid`) as the stable test attribute |
| V. Secrets Management | ✅ Pass | No new secrets; auth remains env-based through existing global setup |
| VI. Parallel-Safe Design | ✅ Pass | Default storageState is read-only; each test runs in isolated browser context |
| VII. Fixture Imports | ✅ Pass | `checkout.spec.ts` imports `{ test, expect }` from `@fixtures` |
| VIII. API Test Purity | ✅ Exempt | UI feature only |

**All gates pass. One Principle IV deviation is documented in Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/004-checkout-flow/
├── plan.md                 # This file
├── research.md             # Phase 0 — 8 architectural decisions
├── data-model.md           # Phase 1 — CheckoutPage interface, selectors,
│                           #           monetary parsing rules
├── quickstart.md           # Phase 1 — setup, run commands, troubleshooting
├── contracts/
│   ├── checkout-page.md    # Step 1/2/3 flow + validation + cancel contracts
│   └── order-summary.md    # Step 2 item + monetary math contract (DOM-driven)
└── tasks.md                # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
pages/
├── checkout.page.ts        # NEW: covers cart entry + checkout step 1/2/3 actions
└── inventory.page.ts       # Existing from 002; used for per-test item setup

tests/
└── e2e/
    └── checkout.spec.ts    # US1 happy path, US2 validation errors,
                            # US3 order summary math, US4 cancel flows
                            # Uses default storageState (no test.use override)

fixtures/
└── index.ts                # Extend existing fixtures with CheckoutPage

utils/
└── routes.ts               # Add checkout route constants if not already present

# Unchanged from 001:
global-setup.ts             # Produces .auth/standard-user.json
playwright.config.ts        # Default storageState + browser projects
```

**Structure Decision**: Single-project root layout, consistent with 001/002. A
single `CheckoutPage` class handles all three checkout steps per feature input,
and tests intentionally avoid `beforeEach` cart setup so item additions happen
inside each test body (Principle III).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principle IV: `data-test` instead of `data-testid` | SauceDemo is a third-party app and exposes `data-test` as its stable testing attribute | We cannot modify the app DOM; `data-test` is semantically equivalent and stable |

---

## Phase 0: Research Summary

All 8 decisions are documented in [research.md](research.md). No
NEEDS CLARIFICATION items remain.

Key decisions:
1. **Single CheckoutPage strategy** — one Page Object spans cart entry plus
   checkout steps 1/2/3
2. **Auth state strategy** — all checkout tests inherit default storageState
   with no overrides
3. **Isolation strategy** — items are added fresh inside each test body
4. **Validation strategy** — step 1 errors asserted with exact SauceDemo strings
5. **Order setup strategy** — summary math test uses exactly Backpack + Bike Light
6. **Money assertion strategy** — parse DOM strings only; no tax-rate recalculation
7. **Grand total formula** — `(itemTotal + tax).toFixed(2) === total.toFixed(2)`
8. **Cancel destination mapping** — step 1 cancel returns cart; step 2 cancel
   returns inventory

## Phase 1: Design Summary

Artifacts generated:
- **[data-model.md](data-model.md)**: TypeScript interfaces for `ICheckoutPage`,
  `CheckoutInfo`, selector inventory, error constants, and DOM money parsing model.
- **[contracts/checkout-page.md](contracts/checkout-page.md)**: Step 1/2/3
  interaction contracts, validation errors, and cancel destination rules.
- **[contracts/order-summary.md](contracts/order-summary.md)**: Two-item order
  summary contract with DOM-parsed arithmetic and `toFixed(2)` grand total check.
- **[quickstart.md](quickstart.md)**: Setup and run guide, expected output,
  constitution verification commands, and troubleshooting.

## Post-Phase 1 Constitution Re-check

All principles continue to pass after design.

- Principle III is enforced by requiring fresh item additions within each test.
- Principle II is enforced by centralizing all checkout selectors in `CheckoutPage`.
- Principle IV deviation remains bounded to `data-test` selectors required by
  the third-party SauceDemo UI.

**Dependency note**: This feature depends on 001 for authenticated storage state
and on 002 inventory interactions for deterministic per-test cart setup before
starting checkout.
