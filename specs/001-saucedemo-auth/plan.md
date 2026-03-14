# Implementation Plan: Authentication Flows — SauceDemo

**Branch**: `001-saucedemo-auth` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-saucedemo-auth/spec.md`

## Summary

Implement end-to-end authentication test coverage for SauceDemo
(`https://www.saucedemo.com`): successful login, four error states (locked
account, wrong credentials, empty username, empty password), logout with
post-logout URL guard, and session persistence on page reload.

The feature establishes the **foundational project infrastructure** —
`LoginPage`, `InventoryPage` (auth-scoped), `fixtures/index.ts`,
`global-setup.ts`, and `playwright.config.ts` — that all other UI features
inherit.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict: true`, `noImplicitAny: true`
**Primary Dependencies**: `@playwright/test`, `allure-playwright`,
  `eslint`, `@typescript-eslint/eslint-plugin`
**Storage**: `.auth/standard-user.json` — Playwright storage state (gitignored)
**Testing**: `@playwright/test` native runner; 3 browser projects: chromium,
  firefox, webkit; `fullyParallel: true`; `retries: 1` in CI
**Target Platform**: Web application — `https://www.saucedemo.com`
**Project Type**: E2E UI test suite (Page Object Model)
**Performance Goals**: Full auth suite (3 browsers) completes in < 60s on CI
**Constraints**: Credentials via `process.env.SAUCE_USERNAME` / `SAUCE_PASSWORD`;
  no selectors in test files; explicit `storageState: undefined` opt-out in
  `login.spec.ts`
**Scale/Scope**: 8 test scenarios, 2 test files, 2 Page Object classes,
  1 global setup

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Strict TypeScript | ✅ Pass | `strict: true`; no `any`; all Page Object methods typed |
| II. Page Object Model | ✅ Pass | `LoginPage` + `InventoryPage` own all selectors; zero locators in test files |
| III. Test Isolation | ✅ Pass | `login.spec.ts`: each test starts logged-out via `storageState: undefined`; `session.spec.ts`: each test loads clean auth state from file |
| IV. Selector Hierarchy | ⚠️ Justified | SauceDemo uses `data-test`, not `data-testid`. Semantically equivalent; third-party app. Burger/logout use `id` (no `data-test` available). Both documented in Complexity Tracking. |
| V. Secrets Management | ✅ Pass | `SAUCE_USERNAME` + `SAUCE_PASSWORD` from `process.env`; `.env` + `.auth/` gitignored |
| VI. Parallel-Safe Design | ✅ Pass | Login tests: no shared state; session tests: storage state is read-only per-test |
| VII. Fixture Imports | ✅ Pass | All test files import `{ test, expect }` from `@fixtures` |
| VIII. API Test Purity | ✅ Exempt | UI feature only |

**All gates pass. One Principle IV deviation is fully justified — see Complexity
Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/001-saucedemo-auth/
├── plan.md              # This file
├── research.md          # Phase 0 — 8 architectural decisions
├── data-model.md        # Phase 1 — Page Object interfaces, selectors,
│                        #           error constants, session lifecycle
├── quickstart.md        # Phase 1 — setup, run commands, troubleshooting
├── contracts/
│   ├── login-page.md    # LoginPage selector + interaction contracts
│   ├── session.md       # Logout + persistence contracts
│   └── global-setup.md  # global-setup.ts bootstrapping contract
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
pages/
├── login.page.ts        # LoginPage: goto, fillUsername, fillPassword, submit,
│                        #   login (composed), getErrorMessage, isErrorVisible
└── inventory.page.ts    # InventoryPage (auth-scoped): goto, isOnInventoryPage,
                         #   openBurgerMenu, logout

tests/
└── e2e/
    ├── login.spec.ts    # US1 (successful login) + US2 (4 error states)
    │                    # test.use({ storageState: undefined }) — opted out
    └── session.spec.ts  # US3 (logout + post-logout guard) + US4 (reload)
                         # uses global default storageState

fixtures/
└── index.ts             # Extends base test; exports { test, expect };
                         # injects LoginPage + InventoryPage as typed fixtures

utils/
├── auth.ts              # getSauceCredentials(), LOCKED_OUT_USER constant,
│                        #   INVALID_CREDENTIALS constant
└── routes.ts            # ROUTES.LOGIN, ROUTES.INVENTORY

global-setup.ts          # Saves .auth/standard-user.json before suite runs
playwright.config.ts     # storageState default, 3 browser projects,
                         #   fullyParallel, retries: 1, allure reporter
tsconfig.json            # strict: true; @pages, @fixtures, @utils path aliases
.env                     # gitignored; SAUCE_USERNAME, SAUCE_PASSWORD
.auth/                   # gitignored; standard-user.json
```

**Structure Decision**: Single-project layout at repository root per CLAUDE.md.
This feature establishes the shared infrastructure (playwright.config.ts,
global-setup.ts, fixtures/index.ts) used by all subsequent UI features 002–004.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle IV: `data-test` instead of `data-testid` | SauceDemo (third-party) uses `data-test` as its test-attribute convention | Cannot add attributes to a site we don't control; `data-test` is semantically equivalent and equally stable |
| Principle IV: `id` selectors for burger menu + logout link | SauceDemo exposes no `data-test` attribute on these elements | No `data-test` or ARIA role available; `id` is the most stable fallback; both live inside `InventoryPage` so test files remain selector-free |

---

## Phase 0: Research Summary

All 8 decisions documented in [research.md](research.md). No NEEDS CLARIFICATION
items remain.

Key decisions:
1. **Two-file test split** — `login.spec.ts` (`storageState: undefined`) + `session.spec.ts` (default storageState)
2. **`data-test` attribute** — SauceDemo equivalent of `data-testid`; justified Principle IV deviation
3. **Exact error strings** — all four messages include "Epic sadface: " prefix
4. **LoginPage method design** — atomic (`fillUsername`, `fillPassword`) + composed (`login`) actions; no `Locator` exposure
5. **InventoryPage (auth-scoped)** — foundation extended by feature 002
6. **global-setup.ts** — uses `LoginPage`; fails fast on missing env vars; verifies login before saving state
7. **Post-logout URL guard** — asserted in same test body as logout (Principle III)
8. **Env vars** — `SAUCE_USERNAME`, `SAUCE_PASSWORD`

## Phase 1: Design Summary

Artifacts generated:
- **[data-model.md](data-model.md)**: TypeScript interfaces for `ILoginPage`,
  `IInventoryPage`, `Credentials`, route constants, full selector inventory with
  constitution notes, error message constants (`ERROR_MESSAGES`), and session
  state lifecycle diagram.
- **[contracts/login-page.md](contracts/login-page.md)**: Happy-path + 4 error
  state contracts; exact selector values and expected DOM outcomes.
- **[contracts/session.md](contracts/session.md)**: Logout and persistence
  contracts; step sequences; isolation note for post-logout guard.
- **[contracts/global-setup.md](contracts/global-setup.md)**: Bootstrapping
  sequence, failure modes, and storage state output format.
- **[quickstart.md](quickstart.md)**: Environment setup, run commands, expected
  output, constitution compliance verification scripts, troubleshooting.

## Post-Phase 1 Constitution Re-check

All principles pass. The two Principle IV deviations are documented, scoped to
Page Objects (not test files), and are the minimum necessary to test a third-party
site. No new violations were introduced by the design.

**Dependency note**: Features 002-inventory-listing, 003-shopping-cart, and
004-checkout-flow all depend on this feature's infrastructure. `InventoryPage`
will be extended (not replaced) by feature 002. `fixtures/index.ts`,
`playwright.config.ts`, and `global-setup.ts` are shared across all features.
