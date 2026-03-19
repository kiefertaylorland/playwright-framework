# Playwright Test Framework

Enterprise-grade Playwright/TypeScript test automation framework targeting open-source e-commerce sites ([SauceDemo](https://www.saucedemo.com) and [Practice Software Testing](https://practicesoftwaretesting.com)). Covers UI end-to-end flows, REST API contract validation, and is structured for OWASP-aligned security testing.

## What's covered

| Suite | Target | Tests |
|---|---|---|
| `tests/e2e/` | SauceDemo UI | Login, session, inventory, cart, checkout |
| `tests/api/` | Practice Software Testing API | Auth, product catalog, categories |
| `tests/security/` | SauceDemo | A01 Access Control, A02 Cookies, A03 Injection (XSS/SQLi), A05 Headers, A07 Auth |

**116 E2E tests** · **22 Security tests** · Chromium · Firefox · WebKit · OWASP ZAP integration

## Stack

- **[Playwright Test](https://playwright.dev)** — test runner, browser automation, API request fixture
- **TypeScript 5** — strict mode, `noImplicitAny`
- **Page Object Model** — all selectors and interactions encapsulated in `pages/`
- **Custom fixtures** — page objects injected via `fixtures/index.ts`, imported instead of `@playwright/test`
- **Global setup** — single pre-run login that saves browser storage state to `.auth/standard-user.json`, reused by all E2E tests to avoid repeated authentication
- **[OWASP ZAP](https://www.zaproxy.org/)** — Docker-based passive vulnerability scanning, REST API integration for alert validation
- **Allure** — rich HTML report with step-level detail

## Project structure

```
pages/          # Page Object classes (one per page)
tests/
  e2e/          # Browser-driven UI tests (Chromium, Firefox, WebKit)
  api/          # Headless API contract tests (no browser)
  security/     # OWASP-aligned security tests (A01-A07)
    ├── access-control.spec.ts      # A01 Broken Access Control
    ├── crypto-failures.spec.ts     # A02 Cryptographic Failures (cookie security)
    ├── injection.spec.ts           # A03 Injection (XSS + SQLi payloads)
    ├── headers.spec.ts             # A05 Security Misconfiguration (response headers)
    ├── auth-security.spec.ts       # A07 Auth Failures (lockout + session invalidation)
    └── zap-passive-scan.spec.ts    # ZAP integration (passive scanning + alert validation)
fixtures/       # Extended test/expect exported for all tests
utils/
  ├── auth.ts                       # Auth helpers, fixtures
  ├── routes.ts                     # Route constants
  ├── security-payloads.ts          # XSS/SQLi payload definitions
  └── zap-helper.ts                 # ZAP REST API helpers
docker/         # Infrastructure-as-code
  └── docker-compose.zap.yml        # OWASP ZAP container definition
.auth/          # Saved storage state (gitignored, created at runtime)
.github/
  └── workflows/
      ├── test.yml                  # E2E + API tests
      └── security.yml              # Security tests with ZAP
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
# All tests (E2E across 3 browsers + API + Security)
npx playwright test

# E2E tests only
npx playwright test tests/e2e/

# API tests only (4 parallel workers, no browser)
npm run test:api

# Security tests only (without ZAP)
ZAP_PROXY_SKIP=1 npm run test:security

# Security tests with ZAP passive scanning
npm run zap:up                    # Start ZAP Docker container (wait 10s)
npx playwright test --project=security
npm run zap:down                  # Stop ZAP

# Specific file
npx playwright test tests/security/injection.spec.ts

# Specific test by name
npx playwright test --grep "XSS payload"

# Single browser
npx playwright test --project=chromium

# Headed mode (watch the browser)
npx playwright test --headed

# Interactive UI mode
npx playwright test --ui

# Record traces, screenshots, and video for all tests
npm run test:auth:artifacts
```

## Security Testing

The security test suite covers **OWASP Top 10** vulnerabilities testable via Playwright and integrates **OWASP ZAP** for passive vulnerability scanning.

### Implemented Coverage

| OWASP Category | Test File | Type | Coverage |
|---|---|---|---|
| **A01** Broken Access Control | `access-control.spec.ts` | UI | Unauthenticated route bypass, redirect enforcement |
| **A02** Cryptographic Failures | `crypto-failures.spec.ts` | UI | Session cookie security flags (httpOnly, secure, sameSite) |
| **A03** Injection (XSS) | `injection.spec.ts` | UI | Payload HTML-escaping, safe response handling |
| **A03** Injection (SQLi) | `injection.spec.ts` | UI | Safe error responses, database integrity |
| **A05** Security Misconfiguration | `headers.spec.ts` | API | Response headers validation (X-Content-Type-Options, X-Frame-Options, CSP) |
| **A07** Auth Failures (Lockout) | `auth-security.spec.ts` | UI | Brute-force lockout enforcement |
| **A07** Auth Failures (Session) | `auth-security.spec.ts` | UI | Session invalidation on logout |
| **ZAP Integration** | `zap-passive-scan.spec.ts` | UI+API | Passive scanning, alert validation, CI failure on Critical/High |

### Running Security Tests

**Without ZAP** (fast local development):
```bash
export SAUCE_USERNAME=standard_user
export SAUCE_PASSWORD=secret_sauce
ZAP_PROXY_SKIP=1 npx playwright test tests/security/ --project=security
# Result: 19 tests pass, 3 ZAP tests skipped
```

**With ZAP Docker proxy** (full vulnerability scanning):
```bash
npm run zap:up                    # Start OWASP ZAP container
npx playwright test --project=security
npm run zap:down                  # Stop ZAP
# Fails on any Critical/High severity findings
```

### Architecture

- **Security project** in `playwright.config.ts` routes all Chromium traffic through ZAP proxy (port 8080)
- **Payload definitions** in `utils/security-payloads.ts` — reusable XSS/SQLi injection strings
- **ZAP helper** in `utils/zap-helper.ts` — REST API response parsing
- **Page Object reuse** — all tests use existing page objects (LoginPage, InventoryPage, etc.)
- **CI integration** — `.github/workflows/security.yml` runs security tests on every PR and main push

### Expectations

- **Local testing** (`ZAP_PROXY_SKIP=1`): 19/22 tests pass (ZAP tests skip gracefully)
- **With ZAP**: All tests run; CI fails if ZAP finds Critical/High alerts
- **Expected failures**: `headers.spec.ts` may fail on SauceDemo demo site (intentional documentation of gaps)

For detailed setup and troubleshooting, see [`specs/006-owasp-security-tests/quickstart.md`](specs/006-owasp-security-tests/quickstart.md).

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

## CI/CD

**Workflows:**
- **`test.yml`** — Runs on every PR and push to `main`
  - Lint and TypeScript type-check (required)
  - E2E tests across Chromium, Firefox, WebKit (4 workers, retry once)
  - API contract tests (headless, no browser)
  - Publishes Allure report as artifact

- **`security.yml`** — Runs on every PR/push, weekly schedule, and manual dispatch
  - Lint and TypeScript type-check (required)
  - Starts OWASP ZAP Docker container on port 8080
  - Runs security tests with ZAP passive scanning (Chromium only)
  - Queries ZAP REST API for findings
  - **Fails CI if any Critical or High severity alerts are present**
  - Stops ZAP and cleans up resources
  - Publishes security report as artifact

**Configuration:** Both pipelines use 4 workers, retry once on failure, and run from Linux runners with Docker support.
