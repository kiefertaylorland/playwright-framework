# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Enterprise-grade Playwright/TypeScript test automation framework targeting open-source e-commerce sites (SauceDemo or Practice Software Testing). This is a portfolio project positioning as a **security-focused QA automation framework** — covering both functional and OWASP-aligned security testing.

## Development Methodology

- **TDD (Test Driven Development)**: Write tests before implementation
- **SDD (Spec Driven Development)**: Derive tests from specifications/requirements
- **Shift-left DevSecOps**: Security checks integrated into CI/CD pipeline, not bolted on after
- **Shift-left QA**: Quality validation as early as possible in the pipeline

## Architecture

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

### Security Testing Integration ✅ IMPLEMENTED

- **Nuclei vulnerability scanning**: Docker-based scanning with 735+ OWASP Top 10 templates, direct URL scanning (one-shot, no proxy)
- **OWASP Top 10 coverage**: A01 (Access Control), A02 (Cryptographic Failures), A03 (Injection - XSS/SQLi), A05 (Security Misconfiguration), A07 (Auth Failures)
  - 22 security tests across 6 test files
  - XSS/SQLi payload definitions in `utils/security-payloads.ts`
  - Nuclei JSONL result parsing via `utils/nuclei-helper.ts`
  - Tests skip gracefully when Nuclei results unavailable (`NUCLEI_SKIP=1`)
- **Security gates in CI**: `.github/workflows/security.yml` fails on Critical/High severity Nuclei findings
- **Baseline testing**: Run without Docker via `npm run test:security` (19 baseline tests, 3 Nuclei tests skip)
- **Full suite**: `npm run nuclei:scan && npm run test:security:with-nuclei` (all 22 tests, with vulnerability scanning)

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

# Run security tests only
npx playwright test tests/security/

# Run API tests only
npx playwright test tests/api/
```

## CI/CD Pipeline

GitHub Actions workflow should:

1. Run lint and type-check on every PR
2. Run full test suite on push to `main`
3. Run Nuclei vulnerability scanning (Docker) and fail on Critical/High findings
4. Run security tests (22 tests: 19 baseline + 3 Nuclei validation)
5. Publish Allure reports as workflow artifacts
6. Include Docker-based runs for environment parity

## Key Playwright Patterns

- Auth storage state is `.auth/standard-user.json` (set in `playwright.config.ts` `use.storageState`)
- Global setup (`globalSetup` in `playwright.config.ts`) handles initial authentication — runs once before all tests
- Fixtures in `fixtures/` extend `test` and `expect` — import from `@fixtures`, not `@playwright/test` directly
- API tests use `request` fixture, not `page` — avoids spinning up a browser unnecessarily
- SauceDemo uses `data-test` attributes (not `data-testid`); CSS class selectors used only where `data-test` is absent
- After sequential clicks that mutate the DOM (e.g. Add to Cart), always await a DOM assertion before the next interaction — WebKit requires this; Chromium/Firefox are more forgiving

## Current Test Suite

- **116 E2E tests**: Login, session, inventory, cart, checkout across Chromium/Firefox/WebKit
- **9 API tests**: Auth, products, categories (headless, no browser)
- **22 security tests**: OWASP A01-A07 (access control, cookies, injection, headers, auth) with ZAP integration
- **Total: 147 tests** — All pass on `main` with `ZAP_PROXY_SKIP=1` (baseline to maintain before merging new work)

## Active Technologies
- **TypeScript 5.x** — Strict mode, `noImplicitAny` enabled
- **Playwright 1.40+** — Browser automation + request fixture
- **Nuclei** — Docker-based vulnerability scanning with 735+ templates, JSONL results
- **Node.js 18+** — Test runtime environment
- **GitHub Actions** — CI/CD pipeline with Docker support

## Recent Changes (ZAP → Nuclei Migration)
- ✅ Migrated from OWASP ZAP (proxy-based) to Nuclei (direct URL scanning)
- ✅ Created Nuclei utilities: `utils/nuclei-helper.ts` (JSONL parsing, result filtering)
- ✅ Created Nuclei test file: `tests/security/nuclei-scan.spec.ts` (3 tests: file exists, valid JSONL, no Critical/High)
- ✅ Created Nuclei Docker config: `docker/docker-compose.nuclei.yml` (735+ templates, no interactsh)
- ✅ Updated npm scripts: `nuclei:scan`, `nuclei:scan:local`, `test:security:with-nuclei`
- ✅ Updated GitHub Actions workflow: `.github/workflows/security.yml` (Nuclei step instead of ZAP service)
- ✅ Created documentation: `docs/NUCLEI_SETUP.md` (setup, troubleshooting, usage)
- ✅ Cleaned up ZAP files: Deleted `utils/zap-helper.ts`, `tests/security/zap-passive-scan.spec.ts`, `docker/docker-compose.zap.yml`, `docs/ZAP_SETUP.md`
- ✅ Updated specifications: `specs/006-owasp-security-tests/quickstart.md` (Nuclei references)
- ✅ Updated README.md: Already reflects Nuclei, no ZAP mentions
