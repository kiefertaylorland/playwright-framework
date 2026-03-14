# Contract: global-setup.ts — Auth State Bootstrapping

**File**: `global-setup.ts` (repository root)
**Output**: `.auth/standard-user.json`
**Spec refs**: FR-001, FR-002 (validation that login succeeds)

## Purpose

`global-setup.ts` runs once before the full test suite and saves the authenticated
browser storage state for `standard_user` to `.auth/standard-user.json`. This
file is then loaded by `playwright.config.ts` as the default `storageState` for
all tests that do not opt out.

## Sequence

| Step | Action | Notes |
|------|--------|-------|
| 1 | Read `SAUCE_USERNAME` and `SAUCE_PASSWORD` from `process.env` | Fail with descriptive error if missing |
| 2 | Launch a Chromium browser (headless) | One browser, one context |
| 3 | Navigate to `https://www.saucedemo.com/` | Using `LoginPage.goto()` |
| 4 | Call `loginPage.login(username, password)` | Uses `LoginPage` Page Object |
| 5 | Assert URL is `/inventory.html` | Confirm login succeeded before saving state |
| 6 | Save storage state to `.auth/standard-user.json` | `context.storageState({ path })` |
| 7 | Close browser | Clean up |

## Failure modes

| Condition | Behaviour |
|-----------|-----------|
| `SAUCE_USERNAME` or `SAUCE_PASSWORD` missing | `throw new Error('Missing env var: ...')` before any browser launch |
| Login redirects to error page | Step 5 assertion fails; setup exits with non-zero code; all tests skip |
| Network unreachable | Playwright timeout; setup fails gracefully |

## Output format

`.auth/standard-user.json` is a Playwright `StorageState` JSON file:

```json
{
  "cookies": [...],
  "origins": [
    {
      "origin": "https://www.saucedemo.com",
      "localStorage": [...]
    }
  ]
}
```

This file is gitignored. It is regenerated on every CI run and on local runs
via `npx playwright test` (which triggers `globalSetup` automatically).

## Notes

- `global-setup.ts` uses the same `LoginPage` class as e2e tests. If the
  selector contract changes, setup and tests change together.
- Only `standard_user` is saved. Tests that require a different starting state
  (e.g., logged-out for login form tests) use `storageState: undefined`.
- The `.auth/` directory is gitignored per Constitution Principle V.
