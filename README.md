# Playwright Test Framework

Enterprise-grade Playwright/TypeScript test automation framework targeting open-source e-commerce sites ([SauceDemo](https://www.saucedemo.com) and [Practice Software Testing](https://practicesoftwaretesting.com)). Covers UI end-to-end flows, REST API contract validation, and is structured for OWASP-aligned security testing.

## What's covered

| Suite | Target | Tests |
|---|---|---|
| `tests/e2e/` | SauceDemo UI | Login, session, inventory, cart, checkout |
| `tests/api/` | Practice Software Testing API | Auth, product catalog, categories |
| `tests/security/` | Both | OWASP Top 10 (planned) |

116 tests · Chromium · Firefox · WebKit

## Stack

- **[Playwright Test](https://playwright.dev)** — test runner, browser automation, API request fixture
- **TypeScript 5** — strict mode, `noImplicitAny`
- **Page Object Model** — all selectors and interactions encapsulated in `pages/`
- **Custom fixtures** — page objects injected via `fixtures/index.ts`, imported instead of `@playwright/test`
- **Global setup** — single pre-run login that saves browser storage state to `.auth/standard-user.json`, reused by all E2E tests to avoid repeated authentication
- **Allure** — rich HTML report with step-level detail

## Project structure

```
pages/          # Page Object classes (one per page)
tests/
  e2e/          # Browser-driven UI tests (Chromium, Firefox, WebKit)
  api/          # Headless API contract tests (no browser)
  security/     # OWASP-aligned security tests (planned)
fixtures/       # Extended test/expect exported for all tests
utils/          # Auth helpers, route constants, API type definitions
.auth/          # Saved storage state (gitignored, created at runtime)
reports/        # Allure report output (gitignored)
test-results/   # Playwright artifacts: traces, screenshots, videos
```

## Setup

**Prerequisites:** Node.js 18+

```bash
npm install
npx playwright install
```

**Environment variables** — copy and fill in:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `SAUCE_USERNAME` | SauceDemo login username |
| `SAUCE_PASSWORD` | SauceDemo login password |
| `PST_API_URL` | Practice Software Testing API base URL |
| `PST_API_USERNAME` | API auth username |
| `PST_API_PASSWORD` | API auth password |

## Running tests

```bash
# All tests (E2E across 3 browsers + API)
npx playwright test

# E2E tests only
npx playwright test tests/e2e/

# API tests only (4 parallel workers, no browser)
npm run test:api

# Specific file
npx playwright test tests/e2e/cart.spec.ts

# Specific test by name
npx playwright test --grep "completing checkout"

# Single browser
npx playwright test --project=chromium

# Headed mode (watch the browser)
npx playwright test --headed

# Interactive UI mode
npx playwright test --ui

# Record traces, screenshots, and video for all tests
npm run test:auth:artifacts
```

## Artifacts

Artifacts are captured on failure by default. Set `PW_RECORD_ARTIFACTS=1` to capture for all tests.

```bash
# Open the HTML report
npm run report:open

# Generate and open Allure report
npx allure generate reports/allure-results --clean && npx allure open

# List captured traces
npm run trace:list

# Open the most recent trace
npm run trace:open:latest
```

## Key patterns

**Imports** — always import `test` and `expect` from `@fixtures`, not `@playwright/test` directly. This gives you typed page object fixtures:

```typescript
import { expect, test } from '@fixtures';

test('example', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.goto();
  await inventoryPage.addProductToCartByIndex(0);
  await cartPage.goto();
  expect(await cartPage.getCartRowCount()).toBe(1);
});
```

**API tests** — use the `request` fixture, not `page`. No browser is launched:

```typescript
test('products endpoint', async ({ request }) => {
  const response = await request.get(`${apiBaseUrl}/products`);
  expect(response.status()).toBe(200);
});
```

**Selectors** — `data-test` attributes are preferred over CSS classes or XPath. CSS class selectors are used only where the target site does not expose test attributes (documented in-code).

**Auth state** — global setup logs in once and writes `.auth/standard-user.json`. All E2E tests load this storage state so no test bears the cost of a login flow.

## Linting and type checking

```bash
npm run lint
npm run typecheck
```

## CI

GitHub Actions runs lint and type-check on every PR, the full test suite on push to `main`, and publishes Allure reports as workflow artifacts. The pipeline is configured to retry once on failure in CI (`retries: 1`) and runs 4 workers.
