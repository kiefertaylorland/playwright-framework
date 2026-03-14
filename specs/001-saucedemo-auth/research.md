# Research: Authentication Flows — SauceDemo

**Feature**: 001-saucedemo-auth
**Date**: 2026-03-13
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Two-file test split (login.spec.ts vs session.spec.ts)

**Decision**: Split auth tests across two files by auth-state precondition:
- `tests/e2e/login.spec.ts` — US1 (successful login) + US2 (error states)
  → sets `test.use({ storageState: undefined })` at file level
- `tests/e2e/session.spec.ts` — US3 (logout) + US4 (session persistence)
  → uses global storageState default (`.auth/standard-user.json`)

**Rationale**: `playwright.config.ts` sets `storageState: '.auth/standard-user.json'`
as the default for all tests. Login tests MUST start from a logged-out state —
they're validating the login form itself. Applying `storageState: undefined` at
the file level opts out cleanly and is the Playwright-idiomatic pattern. Logout and
session tests legitimately start authenticated, so they inherit the default.

**Alternatives considered**:
- Single file with per-test `test.use()` overrides: Messy — Playwright only
  allows `test.use()` at the file scope or inside `describe`, not per individual
  `test()` block. Rejected.
- Single file, all tests log in programmatically: Violates the auth-state
  management pattern; defeats the purpose of `globalSetup` and `storageState`.
  Rejected.

---

## Decision 2: SauceDemo `data-test` attribute (Principle IV justified deviation)

**Decision**: Use `data-test` as the primary selector attribute. SauceDemo does
not use `data-testid`; its equivalent is `data-test`.

**Justification for Constitution Principle IV**: The selector hierarchy requires
`data-testid` as the preference because it is semantically stable and decoupled
from style. `data-test` is the direct equivalent on SauceDemo — it serves the
same purpose and is equally stable. Since we are testing a third-party application
we do not control, we adapt to its attribute convention. This is documented in the
Complexity Tracking section of the plan.

**Known `data-test` values on login page**:

| Element | Selector |
|---------|---------|
| Username input | `[data-test="username"]` |
| Password input | `[data-test="password"]` |
| Login button | `[data-test="login-button"]` |
| Error message container | `[data-test="error"]` |

**Burger menu / navigation** (no `data-test` available on these):
These use `id` attributes, which are acceptable as a fallback since they are
stable and semantically meaningful:

| Element | Selector |
|---------|---------|
| Burger menu button | `#react-burger-menu-btn` |
| Logout sidebar link | `#logout_sidebar_link` |

---

## Decision 3: Exact SauceDemo error message strings

**Decision**: Assert the following exact strings, which are the literal DOM text
SauceDemo renders for each error condition:

| Scenario | Exact displayed message |
|----------|------------------------|
| Locked-out user | `Epic sadface: Sorry, this user has been locked out.` |
| Invalid credentials | `Epic sadface: Username and password do not match any user in this service` |
| Empty username | `Epic sadface: Username is required` |
| Empty password | `Epic sadface: Password is required` |

**Note**: The spec references these in abbreviated form (e.g., "Sorry, this user
has been locked out"). The full messages begin with "Epic sadface: " — tests MUST
assert the complete string to prevent false passes from partial matches.

**Rationale**: Exact message matching is specified by FR-003 and FR-005/FR-006.
Partial matching (`toContain`) is acceptable but the full string is documented
here so the intent is unambiguous in test code.

---

## Decision 4: Page Object design — LoginPage

**Decision**: `LoginPage` exposes atomic actions + one composed action:

```
login(username, password): Promise<void>     // fill + submit
fillUsername(username): Promise<void>
fillPassword(password): Promise<void>
submit(): Promise<void>
getErrorMessage(): Promise<string>           // returns trimmed text content
isErrorVisible(): Promise<boolean>
```

Methods return `void` or domain-typed values. No `Locator` objects are exposed.
The `login()` composed method is used in happy-path and global-setup scenarios.
Atomic methods are used in validation tests where only one field is manipulated.

**Rationale**: Constitution Principle II requires Page Object methods to return
`void` or domain-typed values, never raw `Locator` objects. The atomic/composed
split avoids duplication while keeping test code readable.

---

## Decision 5: Page Object design — InventoryPage (auth-scoped)

**Decision**: `InventoryPage` in this feature only needs what authentication tests
require:

```
goto(): Promise<void>                       // navigate to /inventory.html
isOnInventoryPage(): Promise<boolean>       // URL check
openBurgerMenu(): Promise<void>
logout(): Promise<void>                     // opens menu + clicks logout link
```

The full inventory interactions (product listing, sorting, add-to-cart) are added
in feature `002-inventory-listing`. The `InventoryPage` class is designed to be
extended across features — this feature establishes its foundation.

---

## Decision 6: global-setup.ts strategy

**Decision**: `global-setup.ts` performs one programmatic login using `LoginPage`
via a `request`-backed browser context (no full UI launch overhead) and saves the
storage state to `.auth/standard-user.json`.

**Credentials source**: `process.env.SAUCE_USERNAME` and `process.env.SAUCE_PASSWORD`.
Global setup MUST fail with a clear error if either variable is missing.

**Rationale**: The Playwright docs recommend `page.context().storageState()` after
login in globalSetup. Using the same `LoginPage` class as tests ensures the setup
path uses the same selectors — setup and tests never diverge.

---

## Decision 7: Logout post-redirect guard (US3 scenario 2)

**Decision**: After logout, navigate programmatically to `/inventory.html` within
the test and assert the URL resolves to the login page (SauceDemo redirects
unauthenticated requests to the base URL `/`).

**Implementation**: Use `page.goto('/inventory.html')` then assert
`expect(page).toHaveURL('https://www.saucedemo.com/')` (or equivalent pattern).
This validates FR-010 without requiring a separate test file or shared state.

---

## Decision 8: SauceDemo credentials — env var naming

**Decision**: Use `SAUCE_USERNAME` and `SAUCE_PASSWORD` as the env var names for
SauceDemo credentials (as specified in the tech stack input).

**Test account in scope**: `standard_user` / `secret_sauce` — the only account
in scope per spec Assumptions. The locked-out test uses `locked_out_user` with
the same password; invalid-credential test uses fabricated values. These are
public test credentials but MUST still be injected via env vars per Principle V.
