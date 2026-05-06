# Playwright Test Framework

Enterprise-grade Playwright/TypeScript test automation framework targeting open-source e-commerce sites ([SauceDemo](https://www.saucedemo.com) and [Practice Software Testing](https://practicesoftwaretesting.com)). Covers UI end-to-end flows, REST API contract validation, and OWASP-aligned security discovery.

## What's covered

| Suite | Target | Tests |
|---|---|---|
| `tests/e2e/` | SauceDemo UI | Login, session, inventory, cart, checkout |
| `tests/api/` | Practice Software Testing API | Auth, product catalog, categories |
| `tests/security/` | SauceDemo UI + Practice Software Testing API | Discovery Mode auth/session, input handling, access-control, rate-limit, report integrity |

125 tests · Chromium · Firefox · WebKit · Security project

## Stack

- **[Playwright Test](https://playwright.dev)** — test runner, browser automation, API request fixture
- **TypeScript 5** — strict mode, `noImplicitAny`
- **Page Object Model** — all selectors and interactions encapsulated in `pages/`
- **Custom fixtures** — page objects injected via `fixtures/index.ts`, imported instead of `@playwright/test`
- **Global setup** — single pre-run login that saves browser storage state to `.auth/standard-user.json`, reused by all E2E tests to avoid repeated authentication
- **Security reporting** — Discovery Mode findings are written to `reports/security/security-summary.md`
- **Allure** — rich HTML report with step-level detail

## Project structure

```
pages/          # Page Object classes (one per page)
tests/
  e2e/          # Browser-driven UI tests (Chromium, Firefox, WebKit)
  api/          # Headless API contract tests (no browser)
  security/     # OWASP-aligned Discovery Mode security tests
fixtures/       # Extended test/expect exported for all tests
utils/          # Auth helpers, route constants, API types, security reporting helpers
scripts/        # Repository hygiene checks for security discovery
.auth/          # Saved storage state (gitignored, created at runtime)
reports/        # Allure and security report output (gitignored)
test-results/   # Playwright artifacts: traces, screenshots, videos
```

## Setup

**Prerequisites:** Node.js 24+

```bash
npm install
npx playwright install
```

**Environment variables** — copy and fill in the values you need:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `SAUCE_USERNAME` | SauceDemo login username; defaults to `standard_user` when omitted |
| `SAUCE_PASSWORD` | SauceDemo login password; defaults to the public training password when omitted |
| `PST_API_URL` | Practice Software Testing API base URL; API tests require it, security discovery defaults to `https://api.practicesoftwaretesting.com` |
| `PST_API_USERNAME` | API auth username; required for API auth tests, optional for authenticated security discovery |
| `PST_API_PASSWORD` | API auth password; required for API auth tests, optional for authenticated security discovery |

## Running tests

```bash
# All tests (E2E across 3 browsers + API + security)
npx playwright test

# E2E tests only
npx playwright test tests/e2e/

# API tests only (4 parallel workers, no browser)
npm run test:api

# Security tests only (Discovery Mode, single worker)
npm run test:security

# Full security discovery (tests + secret scan + npm audit)
npm run security:discovery

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

Security discovery writes a Markdown summary to `reports/security/security-summary.md`. The report is gitignored and includes target configuration, check coverage, severity/status counts, detailed findings, skipped coverage, redaction notes, and the graduation path to Enforcement Mode.

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

**Security discovery** — security tests run in the dedicated `security` project without saved auth state. Findings are non-gating in Discovery Mode: review-needed, High, or Critical observations are reported instead of failing the run. Infrastructure errors, invalid test configuration, or report-generation failures may still fail.

## Linting and type checking

```bash
npm run lint
npm run typecheck
```

## CI

GitHub Actions runs lint and type-check on every PR, the full test suite on push to `main`, and publishes Allure reports as workflow artifacts. The pipeline is configured to retry once on failure in CI (`retries: 1`) and runs 4 workers.

The Security Discovery workflow runs on pull requests and manual dispatch with Node.js 24, installs Chromium, runs `npm run security:discovery`, and uploads `reports/security/security-summary.md` as an artifact. Discovery findings are report-only; pull requests should not fail solely because the security summary contains findings.
