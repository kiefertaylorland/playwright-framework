# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Enterprise-grade Playwright/TypeScript test automation framework targeting open-source e-commerce sites (SauceDemo or Practice Software Testing). This is a portfolio project positioning as a **security-focused QA automation framework** — covering both functional and OWASP-aligned security testing.

## Development Methodology

- **TDD (Test Driven Development)**: Write tests before implementation
- **SDD (Spec Driven Development)**: Derive tests from specifications/requirements
- **Shift-left DevSecOps**: Security checks integrated into CI/CD pipeline, not bolted on after
- **Shift-left QA**: Quality validation as early as possible in the pipeline

## Planned Architecture

### Core Framework Components

- **Page Object Model (POM)**: All page interactions abstracted into page classes under `pages/`
- **TypeScript throughout**: Strict typing for all test helpers, fixtures, and utilities
- **Playwright Test runner**: Native `@playwright/test` (not Playwright + Jest/Mocha)
- **API testing co-located with UI tests**: Playwright's `request` context for API calls in the same test files
- **Authentication state management**: Saved storage states in `.auth/` to avoid repeated login in tests
- **Parallel execution**: Tests designed to be independent and runnable with `--workers`

### Directory Structure

```plaintext
pages/          # Page Object classes
tests/
  e2e/          # End-to-end UI tests
  api/          # API-only tests
  security/     # OWASP-aligned security tests
fixtures/       # Custom Playwright fixtures extending base test
utils/          # Shared helpers (auth, data factories, assertions)
.auth/          # Saved browser storage states (gitignored)
docker/         # Dockerfiles for containerized test runs
.github/
  workflows/    # CI/CD pipeline definitions
reports/        # Allure report output (gitignored)
```

### Security Testing Integration

- **Staged security gates**: Discovery Mode is report-only, Enforcement Mode gates on confirmed Critical/High findings, and Production Gate Mode applies to release readiness
- **OWASP ZAP integration**: ZAP or an approved equivalent scanner is required for calibrated web security enforcement where the target is suitable and authorized
- **OWASP Top 10 coverage**: Authentication flaws, XSS, input sanitization, CSRF, JWT validation
- **Safe security testing**: Active scans require local, disposable, owned, or explicitly authorized targets; non-gating findings must still be reported

## Common Commands

Once the framework is initialized:

```bash
# Install dependencies
npm install
npx playwright install

# Run all tests
npx playwright test

# Run a single test file
npx playwright test tests/e2e/login.spec.ts

# Run a single test by name
npx playwright test --grep "should login with valid credentials"

# Run tests in headed mode (for debugging)
npx playwright test --headed

# Run tests in a specific browser
npx playwright test --project=chromium

# Run tests with UI mode (interactive debugger)
npx playwright test --ui

# Run in parallel with N workers
npx playwright test --workers=4

# Generate Allure report
npx allure generate reports/allure-results --clean && npx allure open

# Lint
npm run lint

# Type check
npm run typecheck

# Run security tests only (cleans prior generated security report first)
npm run test:security

# Run full non-gating security discovery
npm run security:discovery

# Run API tests only
npx playwright test tests/api/
```

## CI/CD Pipeline

GitHub Actions workflow should:

1. Run lint and type-check on every PR
2. Run full test suite on push to `main`
3. Run staged security checks: PR Discovery Mode publishes non-gating reports; calibrated `main`/release checks gate on confirmed Critical/High findings
4. Publish Allure reports as workflow artifacts
5. Include Docker-based runs for environment parity

## Key Playwright Patterns

- Auth storage state is `.auth/standard-user.json` (set in `playwright.config.ts` `use.storageState`)
- Global setup (`globalSetup` in `playwright.config.ts`) handles initial authentication — runs once before all tests
- Fixtures in `fixtures/` extend `test` and `expect` — import from `@fixtures`, not `@playwright/test` directly
- API tests use `request` fixture, not `page` — avoids spinning up a browser unnecessarily
- SauceDemo uses `data-test` attributes (not `data-testid`); CSS class selectors used only where `data-test` is absent
- After sequential clicks that mutate the DOM (e.g. Add to Cart), always await a DOM assertion before the next interaction — WebKit requires this; Chromium/Firefox are more forgiving

## Current Test Suite

- 116 tests: E2E (login, session, inventory, cart, checkout) across Chromium/Firefox/WebKit + API (auth, products, categories) headless
- All 116 pass on `main`; baseline to maintain before merging new work

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/006-security-tests/plan.md`
<!-- SPECKIT END -->
