# Playwright Test Framework

Enterprise-grade Playwright/TypeScript test automation framework targeting open-source e-commerce sites ([SauceDemo](https://www.saucedemo.com) and [Practice Software Testing](https://practicesoftwaretesting.com)). Covers UI end-to-end flows, REST API contract validation, and OWASP-aligned security discovery.

## Business problem

B2B SaaS teams ship frequently, but the workflows that matter most — login, role-based access, checkout, onboarding, API integrations — are often the least protected by automated tests. Manual regression is slow, inconsistent, and doesn't scale. When it fails, the cost shows up in rollbacks, customer escalations, and engineering fire drills.

This framework exists to demonstrate one answer to that problem: structured Playwright/TypeScript automation that protects critical business workflows, validates API behavior, and surfaces security-relevant observations before release — integrated into CI with evidence captured on every run.

The security suite runs in **Discovery Mode**: findings are non-gating and report-only. The intent is to establish behavioral baselines for auth flows, input handling, and access control that can graduate to enforcement gates as confidence grows.

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

## Security-aware regression testing

The `tests/security/` suite runs as a dedicated Playwright project with no saved auth state. It covers two target surfaces: the SauceDemo UI and the Practice Software Testing API.

**SauceDemo UI checks** (`tests/security/saucedemo-security.spec.ts`):
- Auth and session behavior — login flow observation, post-auth state verification
- Login input handling — harmless XSS-like and SQLi-like payload submission, reflection detection
- Checkout form handling — payload injection into form fields without completing orders

**Practice Software Testing API checks** (`tests/security/pst-api-security.spec.ts`):
- Public endpoint payload handling — query parameter behavior under boundary and injection-like inputs
- Unauthenticated access control — protected resource endpoints checked without credentials
- Rate-limit observation — repeated invalid login attempts, throttling behavior recorded
- Optional authenticated coverage — enabled when `PST_API_USERNAME` and `PST_API_PASSWORD` are configured

**Repository hygiene checks** (run as part of `npm run security:discovery`):
- Secret scan — scans committed files for private key blocks, bearer token literals, and secret-like assignments
- Dependency audit — runs `npm audit` and surfaces high and critical advisories

All findings are written to `reports/security/security-summary.md` with severity, OWASP category, evidence (redacted), status, and a next-action note. The report is uploaded as a CI artifact on every security discovery run.

```typescript
// Example: observing how a protected endpoint responds without credentials
test('records unauthenticated protected-resource access observations', async ({ request }) => {
  const protectedPaths = ['/users/me', '/favorites', '/orders'];

  for (const protectedPath of protectedPaths) {
    const response = await request.get(`${baseUrl}${protectedPath}`);
    const rejected = [401, 403, 404, 405].includes(response.status());

    // Finding recorded regardless — Discovery Mode surfaces behavior, does not gate
    findings.push(createFinding({
      severity: rejected ? 'INFO' : 'HIGH',
      status: rejected ? 'observed' : 'review-needed',
      // ...
    }));
  }
});
```

Running the full security discovery suite:

```bash
# Security tests + secret scan + npm audit
npm run security:discovery

# Security tests only
npm run test:security
```

## How this maps to SaaS release risk

The workflows covered in this framework directly mirror the critical paths that break in real B2B SaaS releases:

| Framework coverage | SaaS release risk |
|---|---|
| Login, session, logout flows | SSO regressions, broken auth after dependency updates |
| Role-based checkout and cart state | Permission boundary failures, tenant data exposure |
| API contract validation (auth, products, categories) | Undocumented breaking changes, access control drift |
| Input handling observation (XSS-like, SQLi-like) | Output encoding gaps, injection-prone query parameters |
| Unauthenticated access checks | Protected endpoint exposure after route refactors |
| Dependency audit | Vulnerable component risk before release |
| Secret scan | Credential leakage in committed config or test fixtures |

The same structure — Playwright E2E for critical workflows, API contract tests, security-aware checks, CI-integrated reporting — is what a Release Risk Sprint produces for a customer's staging environment against their actual product surface.

## Demo and sample output

**Loom demo**: *[coming soon — will show a critical workflow test, an API validation test, a security observation, and the generated security summary report]*

**Sample security summary report**: `reports/security/security-summary.md` — generated on every `npm run security:discovery` run and uploaded as a GitHub Actions artifact. The report includes target configuration, OWASP-mapped findings, severity and status counts, redaction statement, and the graduation path to Enforcement Mode.

To generate a local report:

```bash
npm run security:discovery
cat reports/security/security-summary.md
```

## Linting and type checking

```bash
npm run lint
npm run typecheck
```

## CI

GitHub Actions runs lint and type-check on every PR, the full test suite on push to `main`, and publishes Allure reports as workflow artifacts. The pipeline is configured to retry once on failure in CI (`retries: 1`) and runs 4 workers.

The Security Discovery workflow runs on pull requests and manual dispatch with Node.js 24, installs Chromium, runs `npm run security:discovery`, and uploads `reports/security/security-summary.md` as an artifact. Discovery findings are report-only; pull requests should not fail solely because the security summary contains findings.
