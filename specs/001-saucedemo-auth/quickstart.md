# Quickstart: Authentication Flow Tests

**Feature**: 001-saucedemo-auth
**Target**: https://www.saucedemo.com

## Prerequisites

```bash
npm install
npx playwright install   # installs Chromium, Firefox, WebKit
```

## Environment Setup

Create `.env` at the repository root (never commit):

```bash
# SauceDemo credentials
SAUCE_USERNAME=standard_user
SAUCE_PASSWORD=secret_sauce
```

The `.env` file is gitignored. In CI these are GitHub Actions secrets injected
as environment variables.

## Running Auth Tests

```bash
# Run only auth tests (both login and session files)
npx playwright test tests/e2e/login.spec.ts tests/e2e/session.spec.ts

# Run login form tests only (US1 + US2, no auth needed)
npx playwright test tests/e2e/login.spec.ts

# Run session tests only (US3 + US4, requires .auth/standard-user.json)
npx playwright test tests/e2e/session.spec.ts

# Run on a single browser
npx playwright test tests/e2e/login.spec.ts --project=chromium

# Run all 3 browser projects
npx playwright test tests/e2e/ --project=chromium --project=firefox --project=webkit

# Headed mode (useful for debugging selectors)
npx playwright test tests/e2e/login.spec.ts --headed --project=chromium
```

## Expected Output

```
Running 14 tests using 4 workers

  ✓ [chromium] › login.spec.ts › Successful Login — redirects to inventory (850ms)
  ✓ [firefox]  › login.spec.ts › Successful Login — redirects to inventory (1.1s)
  ✓ [webkit]   › login.spec.ts › Successful Login — redirects to inventory (940ms)
  ✓ [chromium] › login.spec.ts › Error — locked_out_user shows correct message (420ms)
  ✓ [firefox]  › login.spec.ts › Error — locked_out_user shows correct message (510ms)
  ...
  ✓ [chromium] › session.spec.ts › Logout — returns to login page (380ms)
  ✓ [chromium] › session.spec.ts › Logout — post-logout URL guard redirects (120ms)
  ✓ [chromium] › session.spec.ts › Session persists on page reload (290ms)

  14 passed (8.2s)
```

## Regenerating Auth State

The `.auth/standard-user.json` file is created automatically by `global-setup.ts`
when you run any Playwright command. To regenerate it manually:

```bash
npx playwright test --project=chromium tests/e2e/session.spec.ts
# globalSetup runs first automatically
```

## Linting and Type Checking

```bash
npm run lint
npx tsc --noEmit
```

## Verifying Constitution Compliance

```bash
# Principle VII — must return zero results
grep -r "from '@playwright/test'" tests/

# Principle II — must return zero results (no selectors in test files)
grep -rE "(data-test|locator\(|getByTestId\()" tests/

# Principle V — must return zero results (no hard-coded creds)
grep -rE "(standard_user|secret_sauce|locked_out_user)" tests/
```

## Test File Structure at a Glance

```
tests/e2e/
├── login.spec.ts    ← test.use({ storageState: undefined })
│                      US1: successful login
│                      US2: locked out, invalid creds, empty username, empty password
│
└── session.spec.ts  ← uses default storageState (.auth/standard-user.json)
                       US3: logout → login page; post-logout URL guard
                       US4: page reload → still on inventory
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `SAUCE_USERNAME is not defined` | Missing `.env` | Create `.env` as shown above |
| All session tests fail | `.auth/standard-user.json` corrupted | Delete `.auth/` folder and re-run |
| `Cannot find module '@fixtures'` | Path aliases not configured | Run `npx tsc --noEmit` to diagnose |
| Login test passes but wrong URL | SauceDemo URL changed | Update `ROUTES.INVENTORY` in data model |
| Logout test flaky | Burger menu animation timing | `InventoryPage.logout()` should wait for sidebar before clicking logout link |
